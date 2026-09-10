CREATE OR REPLACE FUNCTION public.peakfit_transition_order(
	order_id_value uuid,
	expected_version_value integer,
	next_status_value public.order_status,
	actor_admin_id_value text,
	reason_value text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
	order_record public.orders%ROWTYPE;
	reservation_count integer;
	expired_count integer;
BEGIN
	SELECT *
	INTO order_record
	FROM public.orders
	WHERE id = order_id_value
	FOR UPDATE;

	IF NOT FOUND THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
	END IF;

	IF order_record.version <> expected_version_value THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VERSION_CONFLICT';
	END IF;

	IF NOT (
		(order_record.status = 'NEW' AND next_status_value IN ('CONTACTED', 'CONFIRMED', 'CANCELLED'))
		OR (order_record.status = 'CONTACTED' AND next_status_value IN ('CONFIRMED', 'CANCELLED', 'REFUSED'))
		OR (order_record.status = 'CONFIRMED' AND next_status_value IN ('PREPARING', 'CANCELLED'))
		OR (order_record.status = 'PREPARING' AND next_status_value IN ('SHIPPED', 'CANCELLED'))
		OR (order_record.status = 'SHIPPED' AND next_status_value IN ('DELIVERED', 'REFUSED'))
		OR (order_record.status = 'DELIVERED' AND next_status_value = 'RETURNED')
	) THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TRANSITION';
	END IF;

	IF next_status_value = 'CONFIRMED' THEN
		PERFORM variant.id
		FROM public.product_variants AS variant
		JOIN public.inventory_reservations AS reservation ON reservation.variant_id = variant.id
		WHERE reservation.order_id = order_id_value
			AND reservation.status = 'ACTIVE'
		ORDER BY variant.id
		FOR UPDATE OF variant;

		SELECT
			count(*)::integer,
			count(*) FILTER (WHERE expires_at <= now())::integer
		INTO reservation_count, expired_count
		FROM public.inventory_reservations
		WHERE order_id = order_id_value
			AND status = 'ACTIVE';

		IF reservation_count = 0 OR expired_count > 0 THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'RESERVATION_EXPIRED';
		END IF;

		IF EXISTS (
			SELECT 1
			FROM (
				SELECT variant_id, sum(quantity)::integer AS quantity
				FROM public.inventory_reservations
				WHERE order_id = order_id_value AND status = 'ACTIVE'
				GROUP BY variant_id
			) AS reserved
			JOIN public.product_variants AS variant ON variant.id = reserved.variant_id
			WHERE variant.stock_quantity < reserved.quantity
				OR variant.reserved_quantity < reserved.quantity
		) THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'RESERVATION_EXPIRED';
		END IF;

		UPDATE public.product_variants AS variant
		SET
			stock_quantity = variant.stock_quantity - reserved.quantity,
			reserved_quantity = variant.reserved_quantity - reserved.quantity,
			updated_at = now()
		FROM (
			SELECT variant_id, sum(quantity)::integer AS quantity
			FROM public.inventory_reservations
			WHERE order_id = order_id_value AND status = 'ACTIVE'
			GROUP BY variant_id
		) AS reserved
		WHERE variant.id = reserved.variant_id
			AND variant.stock_quantity >= reserved.quantity
			AND variant.reserved_quantity >= reserved.quantity;

		UPDATE public.inventory_reservations
		SET status = 'COMMITTED', closed_at = now(), close_reason = 'order_confirmed', updated_at = now()
		WHERE order_id = order_id_value AND status = 'ACTIVE';
	ELSIF next_status_value IN ('CANCELLED', 'REFUSED') AND order_record.status IN ('NEW', 'CONTACTED') THEN
		PERFORM variant.id
		FROM public.product_variants AS variant
		JOIN public.inventory_reservations AS reservation ON reservation.variant_id = variant.id
		WHERE reservation.order_id = order_id_value AND reservation.status = 'ACTIVE'
		ORDER BY variant.id
		FOR UPDATE OF variant;

		UPDATE public.product_variants AS variant
		SET reserved_quantity = greatest(0, variant.reserved_quantity - reserved.quantity), updated_at = now()
		FROM (
			SELECT variant_id, sum(quantity)::integer AS quantity
			FROM public.inventory_reservations
			WHERE order_id = order_id_value AND status = 'ACTIVE'
			GROUP BY variant_id
		) AS reserved
		WHERE variant.id = reserved.variant_id;

		UPDATE public.inventory_reservations
		SET status = 'RELEASED', closed_at = now(), close_reason = 'order_closed_before_confirmation', updated_at = now()
		WHERE order_id = order_id_value AND status = 'ACTIVE';
	ELSIF next_status_value = 'CANCELLED' AND order_record.status IN ('CONFIRMED', 'PREPARING') THEN
		PERFORM variant.id
		FROM public.product_variants AS variant
		JOIN public.inventory_reservations AS reservation ON reservation.variant_id = variant.id
		WHERE reservation.order_id = order_id_value AND reservation.status = 'COMMITTED'
		ORDER BY variant.id
		FOR UPDATE OF variant;

		UPDATE public.product_variants AS variant
		SET stock_quantity = variant.stock_quantity + committed.quantity, updated_at = now()
		FROM (
			SELECT variant_id, sum(quantity)::integer AS quantity
			FROM public.inventory_reservations
			WHERE order_id = order_id_value AND status = 'COMMITTED'
			GROUP BY variant_id
		) AS committed
		WHERE variant.id = committed.variant_id;

		UPDATE public.inventory_reservations
		SET status = 'RELEASED', closed_at = now(), close_reason = 'order_cancelled_after_confirmation', updated_at = now()
		WHERE order_id = order_id_value AND status = 'COMMITTED';
	ELSIF next_status_value IN ('REFUSED', 'RETURNED') AND order_record.status IN ('SHIPPED', 'DELIVERED') THEN
		PERFORM variant.id
		FROM public.product_variants AS variant
		JOIN public.inventory_reservations AS reservation ON reservation.variant_id = variant.id
		WHERE reservation.order_id = order_id_value AND reservation.status = 'COMMITTED'
		ORDER BY variant.id
		FOR UPDATE OF variant;

		UPDATE public.product_variants AS variant
		SET stock_quantity = variant.stock_quantity + committed.quantity, updated_at = now()
		FROM (
			SELECT variant_id, sum(quantity)::integer AS quantity
			FROM public.inventory_reservations
			WHERE order_id = order_id_value AND status = 'COMMITTED'
			GROUP BY variant_id
		) AS committed
		WHERE variant.id = committed.variant_id;

		UPDATE public.inventory_reservations
		SET status = 'RELEASED', closed_at = now(), close_reason = 'order_returned_to_stock', updated_at = now()
		WHERE order_id = order_id_value AND status = 'COMMITTED';
	END IF;

	UPDATE public.orders
	SET
		status = next_status_value,
		version = version + 1,
		confirmed_at = CASE WHEN next_status_value = 'CONFIRMED' THEN now() ELSE confirmed_at END,
		shipped_at = CASE WHEN next_status_value = 'SHIPPED' THEN now() ELSE shipped_at END,
		delivered_at = CASE WHEN next_status_value = 'DELIVERED' THEN now() ELSE delivered_at END,
		updated_at = now()
	WHERE id = order_id_value;

	INSERT INTO public.order_status_history (
		order_id, from_status, to_status, actor_admin_id, reason, metadata
	) VALUES (
		order_id_value,
		order_record.status,
		next_status_value,
		actor_admin_id_value,
		nullif(trim(reason_value), ''),
		jsonb_build_object('source', 'admin_dashboard')
	);

	IF order_record.customer_email IS NOT NULL THEN
		INSERT INTO public.notification_outbox (
			order_id, channel, kind, recipient, template_key, locale, payload, dedupe_key
		) VALUES (
			order_id_value,
			'EMAIL',
			'ORDER_STATUS_CHANGED',
			order_record.customer_email,
			'order_status_customer',
			'fr',
			jsonb_build_object(
				'customerName', order_record.customer_name,
				'reference', order_record.reference,
				'total', order_record.total,
				'currency', order_record.currency,
				'status', next_status_value::text
			),
			order_id_value::text || ':email:status:' || next_status_value::text
		)
		ON CONFLICT (dedupe_key) DO NOTHING;
	END IF;

	RETURN jsonb_build_object('status', next_status_value, 'version', order_record.version + 1);
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.peakfit_transition_order(uuid, integer, public.order_status, text, text) FROM PUBLIC;
