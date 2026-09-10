CREATE OR REPLACE FUNCTION public.peakfit_release_expired_reservations(
	batch_size integer DEFAULT 500
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
	reservation_ids uuid[];
	released_count integer := 0;
BEGIN
	IF batch_size IS NULL OR batch_size < 1 OR batch_size > 2000 THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_BATCH_SIZE';
	END IF;

	SELECT array_agg(candidate.id ORDER BY candidate.id)
	INTO reservation_ids
	FROM (
		SELECT reservation.id
		FROM public.inventory_reservations AS reservation
		WHERE reservation.status = 'ACTIVE'
			AND reservation.expires_at <= now()
		ORDER BY reservation.expires_at, reservation.id
		LIMIT batch_size
	) AS candidate;

	IF reservation_ids IS NULL THEN
		RETURN 0;
	END IF;

	PERFORM variant.id
	FROM public.product_variants AS variant
	JOIN public.inventory_reservations AS reservation
		ON reservation.variant_id = variant.id
	WHERE reservation.id = ANY(reservation_ids)
	ORDER BY variant.id
	FOR UPDATE OF variant;

	WITH expired AS (
		UPDATE public.inventory_reservations AS reservation
		SET
			status = 'EXPIRED',
			closed_at = now(),
			close_reason = 'reservation_window_elapsed',
			updated_at = now()
		WHERE reservation.id = ANY(reservation_ids)
			AND reservation.status = 'ACTIVE'
			AND reservation.expires_at <= now()
		RETURNING reservation.variant_id, reservation.quantity
	), released AS (
		SELECT expired.variant_id, sum(expired.quantity)::integer AS quantity
		FROM expired
		GROUP BY expired.variant_id
	), updated_variants AS (
		UPDATE public.product_variants AS variant
		SET
			reserved_quantity = greatest(0, variant.reserved_quantity - released.quantity),
			updated_at = now()
		FROM released
		WHERE variant.id = released.variant_id
		RETURNING variant.id
	)
	SELECT count(*)::integer
	INTO released_count
	FROM expired;

	RETURN released_count;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.peakfit_release_expired_reservations(integer) FROM PUBLIC;
