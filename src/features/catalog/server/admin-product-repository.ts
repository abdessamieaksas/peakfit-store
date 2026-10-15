import "server-only";

import { randomUUID } from "node:crypto";

import { asc, eq, sql } from "drizzle-orm";

import type { AdminProductInput } from "@/features/catalog/domain/admin-product";
import { getDb, getNeonClient } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { listLocalProductImages, resolveProductImages } from "@/features/catalog/server/product-image-storage";

export { listLocalProductImages };

function primaryFirst<T extends { url: string }>(images: T[], primaryUrl: string) {
  return [...images].sort((a, b) => Number(b.url === primaryUrl) - Number(a.url === primaryUrl));
}

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  categoryId: string | null;
  price: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  image: string;
  totalStock: number;
  availableStock: number;
  variantCount: number;
};

export type AdminProductDetail = AdminProductRow & {
  summary: string;
  description: string;
  imageAlt: string;
  benefits: string[];
  images: Array<{
    url: string;
    storageProvider: string;
    storageKey: string;
    width: number;
    height: number;
    alt: string;
    position: number;
    isPrimary: boolean;
  }>;
  colors: string[];
  sizes: string[];
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    stock: number;
    reserved: number;
    available: number;
  }>;
};

export async function listAdminProductCategories() {
  return getDb()
    .select({ id: categories.id, name: categories.nameFr })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.position));
}

export async function listAdminProducts(page: number): Promise<{ rows: AdminProductRow[]; total: number; page: number }> {
  const pageSize = 20;
  const db = getDb();
  const countResult = await db.execute<{ total: number }>(sql`SELECT count(*)::integer AS total FROM public.products`);
  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const result = await db.execute<AdminProductRow>(sql`SELECT
    product.id,
    product.name_fr AS name,
    product.slug,
    category.name_fr AS category,
    category.id AS "categoryId",
    product.base_price AS price,
    product.status,
    product.is_featured AS featured,
    coalesce(image.public_url, '') AS image,
    coalesce(sum(variant.stock_quantity), 0)::integer AS "totalStock",
    coalesce(sum(variant.stock_quantity - variant.reserved_quantity), 0)::integer AS "availableStock",
    count(variant.id)::integer AS "variantCount"
  FROM public.products AS product
  LEFT JOIN public.categories AS category ON category.id = product.category_id
  LEFT JOIN public.product_images AS image ON image.product_id = product.id AND image.is_primary = true
  LEFT JOIN public.product_variants AS variant ON variant.product_id = product.id AND variant.is_active = true
  GROUP BY product.id, category.id, image.public_url
  ORDER BY product.updated_at DESC, product.name_fr ASC
  LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}`);
  return { rows: result.rows, total, page: safePage };
}

export async function getAdminProduct(productId: string): Promise<AdminProductDetail | null> {
  const db = getDb();
  const result = await db.execute<AdminProductDetail>(sql`
    SELECT product.id, product.name_fr AS name, product.slug,
      category.name_fr AS category, category.id AS "categoryId",
      product.base_price AS price, product.status, product.is_featured AS featured,
      coalesce(image.public_url, '') AS image, coalesce(image.alt_fr, '') AS "imageAlt",
      coalesce(product.summary_fr, '') AS summary, coalesce(product.description_fr, '') AS description,
      product.benefits AS benefits,
      coalesce(sum(variant.stock_quantity), 0)::integer AS "totalStock",
      coalesce(sum(variant.stock_quantity - variant.reserved_quantity), 0)::integer AS "availableStock",
      count(DISTINCT variant.id)::integer AS "variantCount"
    FROM public.products AS product
    LEFT JOIN public.categories AS category ON category.id = product.category_id
    LEFT JOIN public.product_images AS image ON image.product_id = product.id AND image.is_primary = true
    LEFT JOIN public.product_variants AS variant ON variant.product_id = product.id AND variant.is_active = true
    WHERE product.id = ${productId}::uuid
    GROUP BY product.id, category.id, image.public_url, image.alt_fr
  `);
  const product = result.rows[0];
  if (!product) return null;

  const detail = await db.execute<{
    id: string;
    sku: string;
    title: string;
    stock: number;
    reserved: number;
    available: number;
    optionName: string;
    valueLabel: string;
  }>(sql`
    SELECT variant.id, variant.sku, variant.title,
      variant.stock_quantity AS stock, variant.reserved_quantity AS reserved,
      variant.stock_quantity - variant.reserved_quantity AS available,
      option.code AS "optionName", value.label_fr AS "valueLabel"
    FROM public.product_variants AS variant
    LEFT JOIN public.variant_option_values AS link ON link.variant_id = variant.id
    LEFT JOIN public.product_option_values AS value ON value.id = link.option_value_id
    LEFT JOIN public.product_options AS option ON option.id = value.option_id
    WHERE variant.product_id = ${productId}::uuid AND variant.is_active = true
    ORDER BY variant.title ASC
  `);
  const variants = new Map<string, AdminProductDetail["variants"][number]>();
  const colors = new Set<string>();
  const sizes = new Set<string>();
  for (const row of detail.rows) {
    const variant = variants.get(row.id) ?? {
      id: row.id,
      sku: row.sku,
      title: row.title,
      stock: row.stock,
      reserved: row.reserved,
      available: row.available,
    };
    variants.set(row.id, variant);
    if (row.optionName === "color") colors.add(row.valueLabel);
    if (row.optionName === "size") sizes.add(row.valueLabel);
  }
  const imageRows = await db.execute<AdminProductDetail["images"][number]>(sql`
    SELECT public_url AS url, storage_provider AS "storageProvider", storage_key AS "storageKey",
      width, height, alt_fr AS alt, position, is_primary AS "isPrimary"
    FROM public.product_images
    WHERE product_id = ${productId}::uuid
    ORDER BY position ASC
  `);
  return { ...product, images: imageRows.rows, variants: [...variants.values()], colors: [...colors], sizes: [...sizes] };
}

export async function listAdminStockHistory(productId: string) {
  const result = await getDb().execute<{
    id: string;
    variantTitle: string;
    change: number;
    before: number;
    after: number;
    reason: string;
    actor: string;
    createdAt: Date;
  }>(sql`
    SELECT adjustment.id, variant.title AS "variantTitle",
      adjustment.change_quantity AS change,
      adjustment.stock_before AS before, adjustment.stock_after AS after,
      adjustment.reason, profile.display_name AS actor, adjustment.created_at AS "createdAt"
    FROM public.inventory_adjustments AS adjustment
    INNER JOIN public.product_variants AS variant ON variant.id = adjustment.variant_id
    INNER JOIN public.admin_profiles AS profile ON profile.auth_user_id = adjustment.actor_admin_id
    WHERE variant.product_id = ${productId}::uuid
    ORDER BY adjustment.created_at DESC
    LIMIT 10
  `);
  return result.rows;
}

export async function createAdminProduct(input: AdminProductInput, actorAdminId: string) {
  const images = primaryFirst(await resolveProductImages(input.images), input.image);
  const colorOptionId = randomUUID();
  const sizeOptionId = randomUUID();
  const colorValues = input.colors.map((label, position) => ({ id: randomUUID(), label, position }));
  const sizeValues = input.sizes.map((label, position) => ({ id: randomUUID(), label, position }));
  const variants = input.colors.flatMap((color, colorIndex) =>
    input.sizes.map((size, sizeIndex) => {
      const id = randomUUID();
      const sku = `PF-${input.slug.toUpperCase().slice(0, 32)}-${String(colorIndex + 1).padStart(2, "0")}-${String(sizeIndex + 1).padStart(2, "0")}`;
      return {
        id,
        sku,
        title: `${color} / ${size}`.slice(0, 180),
        colorValueId: colorValues[colorIndex]!.id,
        sizeValueId: sizeValues[sizeIndex]!.id,
      };
    }),
  );
  const productId = randomUUID();
  const benefits = input.benefits.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const statements = [
    getNeonClient()`INSERT INTO public.products
      (id, category_id, slug, name_fr, summary_fr, description_fr, benefits, base_price, status, is_featured, published_at)
      VALUES (${productId}::uuid, ${input.categoryId}::uuid, ${input.slug}, ${input.name}, ${input.summary}, ${input.description}, ${JSON.stringify(benefits)}::jsonb, ${Math.round(input.priceDh * 100)}, ${input.status}::public.product_status, ${input.featured}, CASE WHEN ${input.status} = 'ACTIVE' THEN now() ELSE NULL END)`,
    ...images.map((image, position) => getNeonClient()`INSERT INTO public.product_images
      (product_id, storage_provider, storage_key, public_url, alt_fr, width, height, position, is_primary)
      VALUES (${productId}::uuid, ${image.storageProvider}, ${image.storageKey}, ${image.url}, ${input.imageAlt}, ${image.width}, ${image.height}, ${position}, ${image.url === input.image})`),
    getNeonClient()`INSERT INTO public.product_options (id, product_id, code, name_fr, position)
      VALUES (${colorOptionId}::uuid, ${productId}::uuid, 'color', 'Couleur', 0), (${sizeOptionId}::uuid, ${productId}::uuid, 'size', 'Taille', 1)`,
    ...colorValues.map((value) => getNeonClient()`INSERT INTO public.product_option_values (id, option_id, code, label_fr, swatch, position)
      VALUES (${value.id}::uuid, ${colorOptionId}::uuid, ${`color-${value.position + 1}`}, ${value.label}, ${knownSwatch(value.label)}, ${value.position})`),
    ...sizeValues.map((value) => getNeonClient()`INSERT INTO public.product_option_values (id, option_id, code, label_fr, position)
      VALUES (${value.id}::uuid, ${sizeOptionId}::uuid, ${`size-${value.position + 1}`}, ${value.label}, ${value.position})`),
    ...variants.flatMap((variant) => [
      getNeonClient()`INSERT INTO public.product_variants (id, product_id, sku, title, stock_quantity, reserved_quantity)
        VALUES (${variant.id}::uuid, ${productId}::uuid, ${variant.sku}, ${variant.title}, ${input.initialStock}, 0)`,
      getNeonClient()`INSERT INTO public.variant_option_values (variant_id, option_value_id)
        VALUES (${variant.id}::uuid, ${variant.colorValueId}::uuid), (${variant.id}::uuid, ${variant.sizeValueId}::uuid)`,
      ...(input.initialStock > 0 ? [getNeonClient()`INSERT INTO public.inventory_adjustments
        (variant_id, actor_admin_id, change_quantity, stock_before, stock_after, reason)
        VALUES (${variant.id}::uuid, ${actorAdminId}, ${input.initialStock}, 0, ${input.initialStock}, 'Stock initial à la création')`] : []),
    ]),
  ];
  await getNeonClient().transaction(statements);
  return productId;
}

function knownSwatch(value: string) {
  const swatches: Record<string, string> = {
    noir: "#09090b",
    blanc: "#f7f6f8",
    lavande: "#b8a2ff",
    violet: "#8c6bff",
    rouge: "#b42318",
    bleu: "#2563eb",
    vert: "#16815a",
  };
  return swatches[value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()] ?? null;
}

export async function updateAdminProduct(productId: string, input: AdminProductInput) {
  const images = primaryFirst(await resolveProductImages(input.images), input.image);
  const benefits = input.benefits.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8);
  await getNeonClient().transaction([
    getNeonClient()`UPDATE public.products SET category_id = ${input.categoryId}::uuid,
      slug = ${input.slug}, name_fr = ${input.name}, summary_fr = ${input.summary},
      description_fr = ${input.description}, benefits = ${JSON.stringify(benefits)}::jsonb,
      base_price = ${Math.round(input.priceDh * 100)}, status = ${input.status}::public.product_status,
      is_featured = ${input.featured},
      published_at = CASE WHEN ${input.status} = 'ACTIVE' THEN coalesce(published_at, now()) ELSE NULL END,
      updated_at = now() WHERE id = ${productId}::uuid`,
    getNeonClient()`DELETE FROM public.product_images WHERE product_id = ${productId}::uuid`,
    ...images.map((image, position) => getNeonClient()`INSERT INTO public.product_images
      (product_id, storage_provider, storage_key, public_url, alt_fr, width, height, position, is_primary)
      VALUES (${productId}::uuid, ${image.storageProvider}, ${image.storageKey}, ${image.url}, ${input.imageAlt}, ${image.width}, ${image.height}, ${position}, ${image.url === input.image})`),
  ]);
}

export async function adjustAdminVariantStock(input: {
  productId: string;
  variantId: string;
  actorAdminId: string;
  delta: number;
  reason: string;
}) {
  const results = await getNeonClient().transaction([
    getNeonClient()`WITH changed AS (
      UPDATE public.product_variants
      SET stock_quantity = stock_quantity + ${input.delta}, updated_at = now()
      WHERE id = ${input.variantId}::uuid AND product_id = ${input.productId}::uuid
        AND stock_quantity + ${input.delta} >= reserved_quantity
        AND stock_quantity + ${input.delta} >= 0
      RETURNING id, stock_quantity - ${input.delta} AS stock_before, stock_quantity AS stock_after
    )
    INSERT INTO public.inventory_adjustments
      (variant_id, actor_admin_id, change_quantity, stock_before, stock_after, reason)
    SELECT id, ${input.actorAdminId}, ${input.delta}, stock_before, stock_after, ${input.reason}
    FROM changed
    RETURNING variant_id AS id, stock_after AS stock`,
  ]);
  const rows = results as unknown as Array<Array<{ id: string; stock: number }>>;
  const row = rows[0]?.[0];
  if (!row) throw new Error("STOCK_CONFLICT");
  return row;
}
