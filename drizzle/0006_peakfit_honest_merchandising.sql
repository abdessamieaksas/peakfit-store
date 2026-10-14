UPDATE public.products
SET tags = array_remove(array_remove(tags, 'badge:nouveau'), 'badge:best-seller'),
    compare_at_price = CASE
      WHEN slug = 'ensemble-running-velocity' AND compare_at_price = 55900 THEN NULL
      ELSE compare_at_price
    END
WHERE tags && ARRAY['badge:nouveau', 'badge:best-seller']::text[]
   OR (slug = 'ensemble-running-velocity' AND compare_at_price = 55900);
