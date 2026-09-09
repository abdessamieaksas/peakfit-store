import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import {
  catalogCategories,
  sampleProducts,
} from "@/features/catalog/data/sample-catalog";
import type {
  CatalogCategory,
  CatalogProduct,
} from "@/features/catalog/domain/types";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import {
  categories,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  variantOptionValues,
} from "@/lib/db/schema";

function badgeFromTags(tags: string[]): CatalogProduct["badge"] {
  if (tags.includes("badge:best-seller")) return "Best-seller";
  if (tags.includes("badge:nouveau")) return "Nouveau";
  return undefined;
}

export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const env = getServerEnv();
  if (env.STORE_DATA_SOURCE === "sample") return catalogCategories;

  const rows = await getDb()
    .select({ slug: categories.slug, label: categories.nameFr })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.position));

  return [
    catalogCategories[0],
    ...rows.map((row) => ({
      slug: row.slug,
      label: row.label,
      shortLabel: row.label.replace(/^T-shirts\s+/i, ""),
    })),
  ];
}

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  const env = getServerEnv();
  if (env.STORE_DATA_SOURCE === "sample") return sampleProducts;

  const db = getDb();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.nameFr,
      summary: products.summaryFr,
      description: products.descriptionFr,
      benefits: products.benefits,
      category: categories.slug,
      price: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      tags: products.tags,
      image: productImages.publicUrl,
      imageWidth: productImages.width,
      imageHeight: productImages.height,
      alt: productImages.altFr,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(eq(products.status, "ACTIVE"))
    .orderBy(asc(products.publishedAt), asc(products.nameFr));

  if (!rows.length) return [];

  const optionRows = await db
    .select({
      productId: productOptions.productId,
      optionCode: productOptions.code,
      optionName: productOptions.nameFr,
      valueCode: productOptionValues.code,
      label: productOptionValues.labelFr,
      swatch: productOptionValues.swatch,
    })
    .from(productOptions)
    .innerJoin(
      productOptionValues,
      eq(productOptionValues.optionId, productOptions.id),
    )
    .where(inArray(productOptions.productId, rows.map((row) => row.id)))
    .orderBy(asc(productOptions.position), asc(productOptionValues.position));

  const variantRows = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      title: productVariants.title,
      priceOverride: productVariants.priceOverride,
      stockQuantity: productVariants.stockQuantity,
      reservedQuantity: productVariants.reservedQuantity,
      optionCode: productOptions.code,
      valueCode: productOptionValues.code,
    })
    .from(productVariants)
    .innerJoin(
      variantOptionValues,
      eq(variantOptionValues.variantId, productVariants.id),
    )
    .innerJoin(
      productOptionValues,
      eq(productOptionValues.id, variantOptionValues.optionValueId),
    )
    .innerJoin(
      productOptions,
      and(
        eq(productOptions.id, productOptionValues.optionId),
        eq(productOptions.productId, productVariants.productId),
      ),
    )
    .where(
      and(
        inArray(productVariants.productId, rows.map((row) => row.id)),
        eq(productVariants.isActive, true),
      ),
    )
    .orderBy(asc(productVariants.id), asc(productOptions.position));

  return rows.map((row) => {
    if (!row.image || !row.imageWidth || !row.imageHeight || !row.alt) {
      throw new Error(`Active product ${row.slug} is missing a primary image.`);
    }

    const productOptionsForRow = optionRows.filter(
      (option) => option.productId === row.id,
    );
    const productVariantsForRow = variantRows.filter(
      (variant) => variant.productId === row.id,
    );
    const groupedVariants = new Map<
      string,
      {
        id: string;
        sku: string;
        title: string;
        price: number;
        availableQuantity: number;
        optionValues: Record<string, string>;
      }
    >();

    for (const variant of productVariantsForRow) {
      const current = groupedVariants.get(variant.id) ?? {
        id: variant.id,
        sku: variant.sku,
        title: variant.title,
        price: variant.priceOverride ?? row.price,
        availableQuantity: Math.max(
          variant.stockQuantity - variant.reservedQuantity,
          0,
        ),
        optionValues: {},
      };

      current.optionValues[variant.optionCode] = variant.valueCode;
      groupedVariants.set(variant.id, current);
    }

    const groupedOptions = new Map<
      string,
      {
        code: string;
        name: string;
        values: Array<{ code: string; label: string; swatch?: string }>;
      }
    >();

    for (const option of productOptionsForRow) {
      const current = groupedOptions.get(option.optionCode) ?? {
        code: option.optionCode,
        name: option.optionName,
        values: [],
      };

      if (!current.values.some((value) => value.code === option.valueCode)) {
        current.values.push({
          code: option.valueCode,
          label: option.label,
          swatch: option.swatch ?? undefined,
        });
      }

      groupedOptions.set(option.optionCode, current);
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      summary: row.summary ?? "Performance Peakfit, pensée pour bouger.",
      description:
        row.description ?? "Une pièce technique Peakfit conçue pour l'entraînement.",
      category: row.category ?? "tous",
      price: row.price,
      compareAtPrice: row.compareAtPrice ?? undefined,
      badge: badgeFromTags(row.tags),
      image: row.image,
      imageWidth: row.imageWidth,
      imageHeight: row.imageHeight,
      alt: row.alt,
      colors: productOptionsForRow
        .filter((option) => option.optionCode === "color")
        .map((option) => option.label),
      sizes: productOptionsForRow
        .filter((option) => option.optionCode === "size")
        .map((option) => option.label),
      options: [...groupedOptions.values()],
      variants: [...groupedVariants.values()],
      benefits: row.benefits.map((benefit) => benefit.fr),
    } satisfies CatalogProduct;
  });
}

export async function getCatalogProductBySlug(slug: string) {
  const catalog = await listCatalogProducts();
  return catalog.find((product) => product.slug === slug);
}
