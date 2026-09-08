import { describe, expect, it } from "vitest";

import {
  catalogCategories,
  getProductBySlug,
  sampleProducts,
} from "@/features/catalog/data/sample-catalog";

describe("sample catalog adapter", () => {
  it("keeps every product addressable by a stable slug", () => {
    for (const product of sampleProducts) {
      expect(getProductBySlug(product.slug)).toEqual(product);
    }
  });

  it("uses data categories instead of page-specific product positions", () => {
    const categorySlugs = new Set(catalogCategories.map((category) => category.slug));
    expect(categorySlugs.has("tous")).toBe(true);
    expect(sampleProducts.every((product) => categorySlugs.has(product.category))).toBe(
      true,
    );
  });

  it("stores money in integer centimes", () => {
    expect(sampleProducts.every((product) => Number.isInteger(product.price))).toBe(true);
  });
});
