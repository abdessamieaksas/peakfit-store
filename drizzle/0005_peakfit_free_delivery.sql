UPDATE public.shipping_zones
SET free_shipping_threshold = 0;
--> statement-breakpoint

ALTER TABLE public.shipping_zones
ALTER COLUMN free_shipping_threshold SET NOT NULL;
--> statement-breakpoint

ALTER TABLE public.shipping_zones
DROP CONSTRAINT shipping_zones_free_threshold_nonnegative;
--> statement-breakpoint

ALTER TABLE public.shipping_zones
ADD CONSTRAINT shipping_zones_free_threshold_zero
CHECK (free_shipping_threshold = 0);
--> statement-breakpoint

UPDATE public.store_settings
SET value = jsonb_set(
  value,
  '{quoteDisclaimer}',
  '"Livraison gratuite partout au Maroc."'::jsonb,
  true
)
WHERE key = 'shipping';
