import { describe, expect, it } from "vitest";
import { z } from "zod";

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

  it("exposes each purchasable option combination as a stable variant", () => {
    for (const product of sampleProducts) {
      const expectedVariantCount = product.options.reduce(
        (count, option) => count * option.values.length,
        1,
      );

      expect(product.variants).toHaveLength(expectedVariantCount);
      expect(new Set(product.variants.map((variant) => variant.id)).size).toBe(
        product.variants.length,
      );
      expect(
        product.variants.every(
          (variant) =>
            z.uuid().safeParse(variant.id).success &&
            variant.availableQuantity > 0 &&
            product.options.every(
              (option) => variant.optionValues[option.code] !== undefined,
            ),
        ),
      ).toBe(true);
    }
  });
});
