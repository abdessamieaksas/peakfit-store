CREATE TABLE "inventory_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"actor_admin_id" text NOT NULL,
	"change_quantity" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reason" varchar(240) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_adjustments_change_nonzero" CHECK ("inventory_adjustments"."change_quantity" <> 0),
	CONSTRAINT "inventory_adjustments_stock_consistent" CHECK ("inventory_adjustments"."stock_before" >= 0 AND "inventory_adjustments"."stock_after" >= 0 AND "inventory_adjustments"."stock_after" - "inventory_adjustments"."stock_before" = "inventory_adjustments"."change_quantity")
);
--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_actor_admin_id_admin_profiles_auth_user_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_profiles"("auth_user_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inventory_adjustments_variant_created_idx" ON "inventory_adjustments" USING btree ("variant_id", "created_at");
