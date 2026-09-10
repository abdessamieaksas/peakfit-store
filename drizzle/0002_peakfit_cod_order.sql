CREATE EXTENSION IF NOT EXISTS "unaccent";--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('WHATSAPP', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('ORDER_RECEIVED', 'ORDER_STATUS_CHANGED');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"recipient" varchar(254) NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"locale" varchar(16) DEFAULT 'fr' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" varchar(180) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"leased_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"provider_message_id" varchar(200),
	"last_error_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_outbox_attempts_nonnegative" CHECK ("notification_outbox"."attempts" >= 0),
	CONSTRAINT "notification_outbox_max_attempts_positive" CHECK ("notification_outbox"."max_attempts" > 0),
	CONSTRAINT "notification_outbox_attempts_bounded" CHECK ("notification_outbox"."attempts" <= "notification_outbox"."max_attempts")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(160);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" varchar(254);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_zone_code" varchar(80);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_zone_name" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_days_min" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_days_max" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "request_fingerprint" char(64);--> statement-breakpoint
UPDATE "orders" AS "order_record"
SET
	"customer_name" = "customer_record"."full_name",
	"customer_phone" = "customer_record"."phone",
	"customer_email" = "customer_record"."email",
	"shipping_zone_code" = 'legacy',
	"shipping_zone_name" = 'Tarif historique',
	"estimated_days_min" = 1,
	"estimated_days_max" = 5,
	"request_fingerprint" = encode(digest("order_record"."idempotency_key", 'sha256'), 'hex')
FROM "customers" AS "customer_record"
WHERE "customer_record"."id" = "order_record"."customer_id";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_zone_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_zone_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "estimated_days_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "estimated_days_max" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "request_fingerprint" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_dedupe_uq" ON "notification_outbox" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notification_outbox_dispatch_idx" ON "notification_outbox" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "notification_outbox_order_idx" ON "notification_outbox" USING btree ("order_id","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_estimate_valid" CHECK ("orders"."estimated_days_min" > 0 AND "orders"."estimated_days_max" >= "orders"."estimated_days_min");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fingerprint_valid" CHECK ("orders"."request_fingerprint" ~ '^[0-9a-f]{64}$');--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."peakfit_normalize_city"("value" text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
	SELECT trim(
		regexp_replace(
			lower(public.unaccent("value")),
			'[^a-z0-9]+',
			' ',
			'g'
		)
	);
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."peakfit_create_cod_order"(
	"payload" jsonb,
	"request_fingerprint" char(64),
	"reservation_minutes" integer
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
	"idempotency_key_value" text;
	"existing_order" public.orders%ROWTYPE;
	"customer_id_value" uuid;
	"order_id_value" uuid := gen_random_uuid();
	"order_reference" text;
	"requested_variant_ids" uuid[];
	"payload_item" jsonb;
	"resolved_item" jsonb;
	"resolved_items" jsonb := '[]'::jsonb;
	"variant_record" record;
	"zone_record" public.shipping_zones%ROWTYPE;
	"quantity_value" integer;
	"subtotal_value" integer := 0;
	"shipping_fee_value" integer;
	"total_value" integer;
	"expires_at_value" timestamptz;
BEGIN
	IF jsonb_typeof("payload") IS DISTINCT FROM 'object' THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;
	IF ("payload" ->> 'contactConsent') IS DISTINCT FROM 'true' THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;

	"idempotency_key_value" := "payload" ->> 'idempotencyKey';
	IF "idempotency_key_value" IS NULL
		OR "idempotency_key_value" !~ '^[0-9a-fA-F-]{36}$'
		OR "request_fingerprint" IS NULL
		OR "request_fingerprint" !~ '^[0-9a-f]{64}$'
		OR "reservation_minutes" IS NULL
		OR "reservation_minutes" < 15
		OR "reservation_minutes" > 10080 THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;

	PERFORM pg_advisory_xact_lock(hashtextextended("idempotency_key_value", 0));

	SELECT *
	INTO "existing_order"
	FROM public.orders
	WHERE idempotency_key = "idempotency_key_value";

	IF FOUND THEN
		IF btrim("existing_order".request_fingerprint) <> btrim("request_fingerprint") THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDEMPOTENCY_CONFLICT';
		END IF;

		RETURN jsonb_build_object(
			'reference', "existing_order".reference,
			'status', "existing_order".status,
			'currency', "existing_order".currency,
			'subtotal', "existing_order".subtotal,
			'shippingFee', "existing_order".shipping_fee,
			'total', "existing_order".total,
			'estimatedDaysMin', "existing_order".estimated_days_min,
			'estimatedDaysMax', "existing_order".estimated_days_max,
			'reservationExpiresAt', (
				SELECT min(reservation.expires_at)
				FROM public.inventory_reservations AS reservation
				WHERE reservation.order_id = "existing_order".id
			),
			'duplicate', true
		);
	END IF;

	IF jsonb_typeof("payload" -> 'items') IS DISTINCT FROM 'array' THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;

	IF jsonb_array_length("payload" -> 'items') < 1
		OR jsonb_array_length("payload" -> 'items') > 20 THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;

	BEGIN
		SELECT array_agg((item ->> 'variantId')::uuid ORDER BY item ->> 'variantId')
		INTO "requested_variant_ids"
		FROM jsonb_array_elements("payload" -> 'items') AS request_items(item);
	EXCEPTION WHEN invalid_text_representation THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END;

	IF cardinality("requested_variant_ids") <>
		cardinality(ARRAY(SELECT DISTINCT unnest("requested_variant_ids"))) THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
	END IF;

	PERFORM variant.id
	FROM public.product_variants AS variant
	WHERE variant.id = ANY("requested_variant_ids")
	ORDER BY variant.id
	FOR UPDATE;

	WITH expired AS (
		UPDATE public.inventory_reservations AS reservation
		SET
			status = 'EXPIRED',
			closed_at = now(),
			close_reason = 'reservation_window_elapsed',
			updated_at = now()
		WHERE reservation.status = 'ACTIVE'
			AND reservation.expires_at <= now()
			AND reservation.variant_id = ANY("requested_variant_ids")
		RETURNING reservation.variant_id, reservation.quantity
	), released AS (
		SELECT expired.variant_id, sum(expired.quantity)::integer AS quantity
		FROM expired
		GROUP BY expired.variant_id
	)
	UPDATE public.product_variants AS variant
	SET
		reserved_quantity = greatest(0, variant.reserved_quantity - released.quantity),
		updated_at = now()
	FROM released
	WHERE variant.id = released.variant_id;

	FOR "payload_item" IN
		SELECT item
		FROM jsonb_array_elements("payload" -> 'items') AS request_items(item)
		ORDER BY item ->> 'variantId'
	LOOP
		BEGIN
			"quantity_value" := ("payload_item" ->> 'quantity')::integer;
		EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
		END;

		IF "quantity_value" IS NULL
			OR "quantity_value" < 1
			OR "quantity_value" > 10 THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST';
		END IF;

		SELECT
			variant.id,
			variant.product_id,
			variant.sku,
			variant.title,
			coalesce(variant.price_override, product.base_price) AS unit_price,
			variant.stock_quantity,
			variant.reserved_quantity,
			product.name_fr AS product_name,
			(
				SELECT image.public_url
				FROM public.product_images AS image
				WHERE image.product_id = product.id
				ORDER BY image.is_primary DESC, image.position, image.id
				LIMIT 1
			) AS image_url,
			coalesce((
				SELECT jsonb_agg(
					jsonb_build_object(
						'code', product_option.code,
						'name', product_option.name_fr,
						'value', option_value.code,
						'label', option_value.label_fr
					)
					ORDER BY product_option.position, option_value.position
				)
				FROM public.variant_option_values AS variant_value
				JOIN public.product_option_values AS option_value
					ON option_value.id = variant_value.option_value_id
				JOIN public.product_options AS product_option
					ON product_option.id = option_value.option_id
					AND product_option.product_id = variant.product_id
				WHERE variant_value.variant_id = variant.id
			), '[]'::jsonb) AS selected_options
		INTO "variant_record"
		FROM public.product_variants AS variant
		JOIN public.products AS product ON product.id = variant.product_id
		WHERE variant.id = ("payload_item" ->> 'variantId')::uuid
			AND variant.is_active = true
			AND product.status = 'ACTIVE';

		IF NOT FOUND THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUCT_UNAVAILABLE';
		END IF;

		IF "variant_record".stock_quantity - "variant_record".reserved_quantity < "quantity_value" THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'OUT_OF_STOCK';
		END IF;

		"subtotal_value" := "subtotal_value" +
			("variant_record".unit_price * "quantity_value");
		"resolved_items" := "resolved_items" || jsonb_build_array(
			jsonb_build_object(
				'productId', "variant_record".product_id,
				'variantId', "variant_record".id,
				'productName', "variant_record".product_name,
				'variantTitle', "variant_record".title,
				'selectedOptions', "variant_record".selected_options,
				'sku', "variant_record".sku,
				'imageUrl', "variant_record".image_url,
				'unitPrice', "variant_record".unit_price,
				'quantity', "quantity_value"
			)
		);
	END LOOP;

	SELECT zone.*
	INTO "zone_record"
	FROM public.shipping_zones AS zone
	WHERE zone.is_active = true
		AND (
			public.peakfit_normalize_city("payload" #>> '{delivery,city}') = ANY(zone.cities)
			OR cardinality(zone.cities) = 0
		)
	ORDER BY
		CASE
			WHEN public.peakfit_normalize_city("payload" #>> '{delivery,city}') = ANY(zone.cities)
			THEN 0
			ELSE 1
		END,
		zone.fee,
		zone.code
	LIMIT 1;

	IF NOT FOUND THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIPPING_UNAVAILABLE';
	END IF;

	"shipping_fee_value" := CASE
		WHEN "zone_record".free_shipping_threshold IS NOT NULL
			AND "subtotal_value" >= "zone_record".free_shipping_threshold
		THEN 0
		ELSE "zone_record".fee
	END;
	"total_value" := "subtotal_value" + "shipping_fee_value";
	"expires_at_value" := now() + make_interval(mins => "reservation_minutes");
	"order_reference" := 'PF-' || to_char(now(), 'YYMMDD') || '-' ||
		upper(substr(replace("order_id_value"::text, '-', ''), 1, 8));

	INSERT INTO public.customers (full_name, phone, email)
	VALUES (
		"payload" #>> '{customer,fullName}',
		"payload" #>> '{customer,phone}',
		nullif("payload" #>> '{customer,email}', '')
	)
	RETURNING id INTO "customer_id_value";

	INSERT INTO public.orders (
		id,
		reference,
		customer_id,
		customer_name,
		customer_phone,
		customer_email,
		status,
		currency,
		subtotal,
		shipping_fee,
		total,
		shipping_zone_code,
		shipping_zone_name,
		estimated_days_min,
		estimated_days_max,
		city,
		region,
		address_line,
		postal_code,
		customer_note,
		attribution,
		idempotency_key,
		request_fingerprint
	)
	VALUES (
		"order_id_value",
		"order_reference",
		"customer_id_value",
		"payload" #>> '{customer,fullName}',
		"payload" #>> '{customer,phone}',
		nullif("payload" #>> '{customer,email}', ''),
		'NEW',
		'MAD',
		"subtotal_value",
		"shipping_fee_value",
		"total_value",
		"zone_record".code,
		"zone_record".name_fr,
		"zone_record".estimated_days_min,
		"zone_record".estimated_days_max,
		"payload" #>> '{delivery,city}',
		nullif("payload" #>> '{delivery,region}', ''),
		"payload" #>> '{delivery,addressLine}',
		nullif("payload" #>> '{delivery,postalCode}', ''),
		nullif("payload" #>> '{delivery,note}', ''),
		coalesce("payload" -> 'attribution', '{}'::jsonb),
		"idempotency_key_value",
		"request_fingerprint"
	);

	INSERT INTO public.order_items (
		order_id,
		product_id,
		variant_id,
		product_name,
		variant_title,
		selected_options,
		sku,
		image_url,
		unit_price,
		quantity,
		line_total
	)
	SELECT
		"order_id_value",
		(item ->> 'productId')::uuid,
		(item ->> 'variantId')::uuid,
		item ->> 'productName',
		item ->> 'variantTitle',
		item -> 'selectedOptions',
		item ->> 'sku',
		item ->> 'imageUrl',
		(item ->> 'unitPrice')::integer,
		(item ->> 'quantity')::integer,
		(item ->> 'unitPrice')::integer * (item ->> 'quantity')::integer
	FROM jsonb_array_elements("resolved_items") AS order_lines(item);

	UPDATE public.product_variants AS variant
	SET
		reserved_quantity = variant.reserved_quantity + requested.quantity,
		updated_at = now()
	FROM (
		SELECT
			(item ->> 'variantId')::uuid AS variant_id,
			(item ->> 'quantity')::integer AS quantity
		FROM jsonb_array_elements("resolved_items") AS reservation_lines(item)
	) AS requested
	WHERE variant.id = requested.variant_id;

	INSERT INTO public.inventory_reservations (
		order_id,
		variant_id,
		quantity,
		status,
		expires_at
	)
	SELECT
		"order_id_value",
		(item ->> 'variantId')::uuid,
		(item ->> 'quantity')::integer,
		'ACTIVE',
		"expires_at_value"
	FROM jsonb_array_elements("resolved_items") AS reservation_lines(item);

	INSERT INTO public.order_status_history (
		order_id,
		from_status,
		to_status,
		reason,
		metadata
	)
	VALUES (
		"order_id_value",
		NULL,
		'NEW',
		'Commande COD soumise',
		'{"source":"storefront"}'::jsonb
	);

	INSERT INTO public.notification_outbox (
		order_id,
		channel,
		kind,
		recipient,
		template_key,
		locale,
		payload,
		dedupe_key
	)
	VALUES (
		"order_id_value",
		'WHATSAPP',
		'ORDER_RECEIVED',
		"payload" #>> '{customer,phone}',
		'order_received',
		'fr',
		jsonb_build_object(
			'customerName', "payload" #>> '{customer,fullName}',
			'reference', "order_reference",
			'total', "total_value",
			'currency', 'MAD',
			'consentSource', 'checkout',
			'consentCapturedAt', now()
		),
		"order_id_value"::text || ':whatsapp:order_received'
	);

	IF nullif("payload" #>> '{customer,email}', '') IS NOT NULL THEN
		INSERT INTO public.notification_outbox (
			order_id,
			channel,
			kind,
			recipient,
			template_key,
			locale,
			payload,
			dedupe_key
		)
		VALUES (
			"order_id_value",
			'EMAIL',
			'ORDER_RECEIVED',
			"payload" #>> '{customer,email}',
			'order_received',
			'fr',
			jsonb_build_object(
				'customerName', "payload" #>> '{customer,fullName}',
				'reference', "order_reference",
				'total', "total_value",
				'currency', 'MAD',
				'consentSource', 'checkout',
				'consentCapturedAt', now()
			),
			"order_id_value"::text || ':email:order_received'
		);
	END IF;

	RETURN jsonb_build_object(
		'reference', "order_reference",
		'status', 'NEW',
		'currency', 'MAD',
		'subtotal', "subtotal_value",
		'shippingFee', "shipping_fee_value",
		'total', "total_value",
		'estimatedDaysMin', "zone_record".estimated_days_min,
		'estimatedDaysMax', "zone_record".estimated_days_max,
		'reservationExpiresAt', "expires_at_value",
		'duplicate', false
	);
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.peakfit_create_cod_order(jsonb, char(64), integer) FROM PUBLIC;
