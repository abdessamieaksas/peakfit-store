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
      label: productOptionValues.labelFr,
    })
    .from(productOptions)
    .innerJoin(
      productOptionValues,
      eq(productOptionValues.optionId, productOptions.id),
    )
    .where(inArray(productOptions.productId, rows.map((row) => row.id)))
    .orderBy(asc(productOptions.position), asc(productOptionValues.position));

  return rows.map((row) => {
    if (!row.image || !row.imageWidth || !row.imageHeight || !row.alt) {
      throw new Error(`Active product ${row.slug} is missing a primary image.`);
    }

    const productOptionsForRow = optionRows.filter(
      (option) => option.productId === row.id,
    );

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
      benefits: row.benefits.map((benefit) => benefit.fr),
    } satisfies CatalogProduct;
  });
}

export async function getCatalogProductBySlug(slug: string) {
  const catalog = await listCatalogProducts();
  return catalog.find((product) => product.slug === slug);
}
