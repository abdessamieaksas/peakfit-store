INSERT INTO "categories" ("id", "slug", "name_fr", "position", "is_active") VALUES
  ('10000000-0000-4000-8000-000000000001', 'compression', 'Compression', 10, true),
  ('10000000-0000-4000-8000-000000000002', 'graphique', 'T-shirts graphiques', 20, true),
  ('10000000-0000-4000-8000-000000000003', 'running', 'Tenues running', 30, true)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "products" (
  "id", "category_id", "slug", "name_fr", "summary_fr", "description_fr",
  "benefits", "base_price", "compare_at_price", "status", "is_featured", "tags", "published_at"
) VALUES
  (
    '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
    'compression-core-noir', 'Compression Core',
    'Maintien ciblé, respirabilité nette et liberté totale.',
    'Un haut de compression technique conçu pour les séances lourdes et les efforts intenses. Sa construction près du corps soutient sans limiter le mouvement.',
    '[{"fr":"Tissu extensible quatre directions"},{"fr":"Zones respirantes à séchage rapide"},{"fr":"Coutures plates anti-frottement"}]'::jsonb,
    25900, NULL, 'ACTIVE', true, ARRAY['badge:nouveau'], now()
  ),
  (
    '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
    't-shirt-kinetic-noir', 'T-shirt Kinetic',
    'Une coupe training nette avec une énergie graphique originale.',
    'Le Kinetic apporte une silhouette athlétique plus décontractée et un graphisme abstrait inspiré du mouvement. Il passe de la salle à la ville sans perdre son identité.',
    '[{"fr":"Jersey doux et respirant"},{"fr":"Coupe athlétique facile à porter"},{"fr":"Graphisme exclusif résistant au lavage"}]'::jsonb,
    22900, NULL, 'ACTIVE', true, ARRAY['badge:best-seller'], now()
  ),
  (
    '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003',
    'ensemble-running-velocity', 'Ensemble Velocity',
    'Une tenue complète, profilée pour courir plus librement.',
    'Un ensemble running ajusté composé d''un haut manches longues et d''un bas technique. Les lignes réfléchissantes améliorent la visibilité sans surcharger la silhouette.',
    '[{"fr":"Ensemble deux pièces coordonné"},{"fr":"Matière légère qui évacue l’humidité"},{"fr":"Détails réfléchissants pour faible luminosité"}]'::jsonb,
    49900, 55900, 'ACTIVE', true, ARRAY['badge:nouveau'], now()
  )
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "product_images" (
  "id", "product_id", "storage_provider", "storage_key", "public_url", "alt_fr", "width", "height", "position", "is_primary"
) VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'app', 'products/compression-core-black.png', '/images/products/compression-core-black.png', 'Athlète portant le t-shirt noir Compression Core Peakfit', 1122, 1402, 0, true),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'app', 'products/kinetic-graphic-tee.png', '/images/products/kinetic-graphic-tee.png', 'Athlète portant le t-shirt noir graphique Kinetic Peakfit', 1122, 1402, 0, true),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'app', 'products/velocity-running-set.png', '/images/products/velocity-running-set.png', 'Athlète portant l''ensemble running noir Velocity Peakfit', 1122, 1402, 0, true)
ON CONFLICT ("storage_provider", "storage_key") DO NOTHING;--> statement-breakpoint

INSERT INTO "product_options" ("id", "product_id", "code", "name_fr", "position") VALUES
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'size', 'Taille', 10),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'color', 'Couleur', 20),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'size', 'Taille', 10),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'color', 'Couleur', 20),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'size', 'Taille', 10),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'color', 'Couleur', 20)
ON CONFLICT ("product_id", "code") DO NOTHING;--> statement-breakpoint

INSERT INTO "product_option_values" ("option_id", "code", "label_fr", "swatch", "position")
SELECT option_id, code, label, swatch, position
FROM (
  VALUES
    ('40000000-0000-4000-8000-000000000001'::uuid, 's', 'S', NULL, 10),
    ('40000000-0000-4000-8000-000000000001'::uuid, 'm', 'M', NULL, 20),
    ('40000000-0000-4000-8000-000000000001'::uuid, 'l', 'L', NULL, 30),
    ('40000000-0000-4000-8000-000000000001'::uuid, 'xl', 'XL', NULL, 40),
    ('40000000-0000-4000-8000-000000000002'::uuid, 'blk', 'Noir', '#09090b', 10),
    ('40000000-0000-4000-8000-000000000002'::uuid, 'lav', 'Lavande', '#b8a2ff', 20),
    ('40000000-0000-4000-8000-000000000003'::uuid, 's', 'S', NULL, 10),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'm', 'M', NULL, 20),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'l', 'L', NULL, 30),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'xl', 'XL', NULL, 40),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'xxl', 'XXL', NULL, 50),
    ('40000000-0000-4000-8000-000000000004'::uuid, 'blk', 'Noir', '#09090b', 10),
    ('40000000-0000-4000-8000-000000000004'::uuid, 'wht', 'Blanc', '#f7f6f8', 20),
    ('40000000-0000-4000-8000-000000000004'::uuid, 'lav', 'Lavande', '#b8a2ff', 30),
    ('40000000-0000-4000-8000-000000000005'::uuid, 's', 'S', NULL, 10),
    ('40000000-0000-4000-8000-000000000005'::uuid, 'm', 'M', NULL, 20),
    ('40000000-0000-4000-8000-000000000005'::uuid, 'l', 'L', NULL, 30),
    ('40000000-0000-4000-8000-000000000005'::uuid, 'xl', 'XL', NULL, 40),
    ('40000000-0000-4000-8000-000000000006'::uuid, 'blk', 'Noir', '#09090b', 10),
    ('40000000-0000-4000-8000-000000000006'::uuid, 'lav', 'Lavande', '#b8a2ff', 20)
) AS values_to_insert(option_id, code, label, swatch, position)
ON CONFLICT ("option_id", "code") DO NOTHING;--> statement-breakpoint

INSERT INTO "product_variants" ("product_id", "sku", "title", "stock_quantity", "reserved_quantity", "is_active")
SELECT product_id, 'PF-' || product_code || '-' || upper(color_code) || '-' || upper(size_code), color_label || ' / ' || upper(size_code), 20, 0, true
FROM (
  VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid, 'CORE'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'KIN'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'VEL')
) AS seeded_products(product_id, product_code)
CROSS JOIN LATERAL (
  SELECT pov.code, pov.label_fr
  FROM "product_options" po
  JOIN "product_option_values" pov ON pov.option_id = po.id
  WHERE po.product_id = seeded_products.product_id AND po.code = 'color'
) AS colors(color_code, color_label)
CROSS JOIN LATERAL (
  SELECT pov.code
  FROM "product_options" po
  JOIN "product_option_values" pov ON pov.option_id = po.id
  WHERE po.product_id = seeded_products.product_id AND po.code = 'size'
) AS sizes(size_code)
ON CONFLICT ("sku") DO NOTHING;--> statement-breakpoint

INSERT INTO "variant_option_values" ("variant_id", "option_value_id")
SELECT variant.id, value.id
FROM "product_variants" variant
JOIN "product_options" option ON option.product_id = variant.product_id
JOIN "product_option_values" value ON value.option_id = option.id
WHERE variant.sku LIKE 'PF-%'
  AND (
    (option.code = 'size' AND lower(split_part(variant.sku, '-', 4)) = value.code)
    OR (option.code = 'color' AND lower(split_part(variant.sku, '-', 3)) = value.code)
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint

INSERT INTO "shipping_zones" (
  "code", "name_fr", "cities", "fee", "free_shipping_threshold", "estimated_days_min", "estimated_days_max", "is_active"
) VALUES
  ('casa-rabat', 'Axe Casablanca–Rabat', ARRAY['casablanca', 'rabat', 'sale', 'mohammedia', 'temara'], 3500, 70000, 1, 2, true),
  ('grandes-villes', 'Grandes villes', ARRAY['agadir', 'fes', 'kenitra', 'marrakech', 'meknes', 'tanger', 'tetouan'], 4500, 70000, 2, 3, true),
  ('maroc', 'Reste du Maroc', ARRAY[]::text[], 5500, 90000, 3, 5, true)
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint

INSERT INTO "store_settings" ("key", "value") VALUES
  ('storefront', '{"currency":"MAD","paymentMethods":["cod"],"defaultLocale":"fr-MA"}'::jsonb),
  ('shipping', '{"quoteDisclaimer":"Le tarif final est recalculé à la commande."}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
