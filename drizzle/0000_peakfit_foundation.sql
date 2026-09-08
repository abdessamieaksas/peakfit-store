CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('OWNER', 'MANAGER', 'FULFILMENT', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('NEW', 'CONTACTED', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUSED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "admin_profiles" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" "admin_role" DEFAULT 'VIEWER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_fr" varchar(120) NOT NULL,
	"name_ar" varchar(120),
	"description_fr" text,
	"description_ar" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"author_admin_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(254),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" "reservation_status" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_reservations_quantity_positive" CHECK ("inventory_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"product_name" varchar(180) NOT NULL,
	"variant_title" varchar(180) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"image_url" text,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_unit_price_nonnegative" CHECK ("order_items"."unit_price" >= 0),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_total_matches" CHECK ("order_items"."line_total" = "order_items"."unit_price" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"actor_admin_id" text,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(32) NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'NEW' NOT NULL,
	"currency" char(3) DEFAULT 'MAD' NOT NULL,
	"subtotal" integer NOT NULL,
	"shipping_fee" integer NOT NULL,
	"total" integer NOT NULL,
	"city" varchar(120) NOT NULL,
	"region" varchar(120),
	"address_line" text NOT NULL,
	"postal_code" varchar(24),
	"customer_note" text,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_subtotal_nonnegative" CHECK ("orders"."subtotal" >= 0),
	CONSTRAINT "orders_shipping_nonnegative" CHECK ("orders"."shipping_fee" >= 0),
	CONSTRAINT "orders_total_matches" CHECK ("orders"."total" = "orders"."subtotal" + "orders"."shipping_fee"),
	CONSTRAINT "orders_version_positive" CHECK ("orders"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"storage_provider" varchar(40) NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"alt_fr" varchar(240) NOT NULL,
	"alt_ar" varchar(240),
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_width_positive" CHECK ("product_images"."width" > 0),
	CONSTRAINT "product_images_height_positive" CHECK ("product_images"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"code" varchar(80) NOT NULL,
	"label_fr" varchar(100) NOT NULL,
	"label_ar" varchar(100),
	"swatch" varchar(40),
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"title" varchar(180) NOT NULL,
	"price_override" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"weight_grams" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_price_nonnegative" CHECK ("product_variants"."price_override" IS NULL OR "product_variants"."price_override" >= 0),
	CONSTRAINT "product_variants_stock_nonnegative" CHECK ("product_variants"."stock_quantity" >= 0),
	CONSTRAINT "product_variants_reserved_valid" CHECK ("product_variants"."reserved_quantity" >= 0 AND "product_variants"."reserved_quantity" <= "product_variants"."stock_quantity"),
	CONSTRAINT "product_variants_weight_positive" CHECK ("product_variants"."weight_grams" IS NULL OR "product_variants"."weight_grams" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"slug" varchar(140) NOT NULL,
	"name_fr" varchar(180) NOT NULL,
	"name_ar" varchar(180),
	"summary_fr" text,
	"summary_ar" text,
	"description_fr" text,
	"description_ar" text,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"base_price" integer NOT NULL,
	"compare_at_price" integer,
	"currency" char(3) DEFAULT 'MAD' NOT NULL,
	"status" "product_status" DEFAULT 'DRAFT' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_base_price_nonnegative" CHECK ("products"."base_price" >= 0),
	CONSTRAINT "products_compare_price_nonnegative" CHECK ("products"."compare_at_price" IS NULL OR "products"."compare_at_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"name_fr" varchar(120) NOT NULL,
	"name_ar" varchar(120),
	"cities" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"fee" integer NOT NULL,
	"free_shipping_threshold" integer,
	"estimated_days_min" integer NOT NULL,
	"estimated_days_max" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_zones_fee_nonnegative" CHECK ("shipping_zones"."fee" >= 0),
	CONSTRAINT "shipping_zones_free_threshold_nonnegative" CHECK ("shipping_zones"."free_shipping_threshold" IS NULL OR "shipping_zones"."free_shipping_threshold" >= 0),
	CONSTRAINT "shipping_zones_estimate_valid" CHECK ("shipping_zones"."estimated_days_min" > 0 AND "shipping_zones"."estimated_days_max" >= "shipping_zones"."estimated_days_min")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by_admin_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_option_values" (
	"variant_id" uuid NOT NULL,
	"option_value_id" uuid NOT NULL,
	CONSTRAINT "variant_option_values_variant_id_option_value_id_pk" PRIMARY KEY("variant_id","option_value_id")
);
--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_author_admin_id_admin_profiles_auth_user_id_fk" FOREIGN KEY ("author_admin_id") REFERENCES "public"."admin_profiles"("auth_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_admin_id_admin_profiles_auth_user_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_updated_by_admin_id_admin_profiles_auth_user_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."admin_profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_option_value_id_product_option_values_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_profiles_role_idx" ON "admin_profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_active_position_idx" ON "categories" USING btree ("is_active","position");--> statement-breakpoint
CREATE INDEX "customer_notes_customer_created_idx" ON "customer_notes" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_reservations_order_variant_uq" ON "inventory_reservations" USING btree ("order_id","variant_id");--> statement-breakpoint
CREATE INDEX "inventory_reservations_expiry_idx" ON "inventory_reservations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_created_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reference_uq" ON "orders" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uq" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_created_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_storage_key_uq" ON "product_images" USING btree ("storage_provider","storage_key");--> statement-breakpoint
CREATE INDEX "product_images_product_position_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_code_uq" ON "product_option_values" USING btree ("option_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_code_uq" ON "product_options" USING btree ("product_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_uq" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_active_idx" ON "product_variants" USING btree ("product_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uq" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_category_status_idx" ON "products" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zones_code_uq" ON "shipping_zones" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_one_primary_uq" ON "product_images" USING btree ("product_id") WHERE "is_primary" = true;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "peakfit_set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "admin_profiles_set_updated_at" BEFORE UPDATE ON "admin_profiles" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "customers_set_updated_at" BEFORE UPDATE ON "customers" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "inventory_reservations_set_updated_at" BEFORE UPDATE ON "inventory_reservations" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "product_variants_set_updated_at" BEFORE UPDATE ON "product_variants" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "products_set_updated_at" BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "shipping_zones_set_updated_at" BEFORE UPDATE ON "shipping_zones" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "store_settings_set_updated_at" BEFORE UPDATE ON "store_settings" FOR EACH ROW EXECUTE FUNCTION "peakfit_set_updated_at"();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "peakfit_guard_order_status_transition"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  transition_allowed boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  transition_allowed := CASE OLD.status
    WHEN 'NEW' THEN NEW.status IN ('CONTACTED', 'CONFIRMED', 'CANCELLED')
    WHEN 'CONTACTED' THEN NEW.status IN ('CONFIRMED', 'CANCELLED')
    WHEN 'CONFIRMED' THEN NEW.status IN ('PREPARING', 'CANCELLED')
    WHEN 'PREPARING' THEN NEW.status IN ('SHIPPED', 'CANCELLED')
    WHEN 'SHIPPED' THEN NEW.status IN ('DELIVERED', 'REFUSED')
    WHEN 'DELIVERED' THEN NEW.status = 'RETURNED'
    ELSE false
  END;

  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'Invalid order status transition from % to %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.version = OLD.version + 1;
  NEW.confirmed_at = CASE
    WHEN NEW.status = 'CONFIRMED' AND OLD.confirmed_at IS NULL THEN now()
    ELSE OLD.confirmed_at
  END;
  NEW.shipped_at = CASE
    WHEN NEW.status = 'SHIPPED' AND OLD.shipped_at IS NULL THEN now()
    ELSE OLD.shipped_at
  END;
  NEW.delivered_at = CASE
    WHEN NEW.status = 'DELIVERED' AND OLD.delivered_at IS NULL THEN now()
    ELSE OLD.delivered_at
  END;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "orders_guard_status_transition" BEFORE UPDATE OF "status" ON "orders" FOR EACH ROW EXECUTE FUNCTION "peakfit_guard_order_status_transition"();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "peakfit_prevent_history_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Order status history is immutable'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;--> statement-breakpoint
CREATE TRIGGER "order_status_history_immutable" BEFORE UPDATE OR DELETE ON "order_status_history" FOR EACH ROW EXECUTE FUNCTION "peakfit_prevent_history_mutation"();
