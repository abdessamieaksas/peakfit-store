import { describe, expect, it } from "vitest";

import {
  adminProductSchema,
  inventoryAdjustmentSchema,
  slugifyProductName,
} from "@/features/catalog/domain/admin-product";

const validProduct = {
  name: "T-shirt compression",
  slug: "t-shirt-compression",
  categoryId: "0d89e83a-bd35-45ba-bab8-c8907ac84704",
  summary: "Compression souple pour entraînements intenses.",
  description: "Un t-shirt technique conçu pour soutenir tes séances et sécher rapidement.",
  priceDh: "259",
  status: "DRAFT",
  featured: false,
  image: "/images/products/compression-core-black.webp",
  imageAlt: "T-shirt de compression noir Peakfit",
  colors: "Noir, Lavande",
  sizes: "S, M, L, XL",
  initialStock: "5",
  benefits: "Tissu extensible\nSéchage rapide",
};

describe("admin product input", () => {
  it("normalizes product labels and retains integer stock and DH price", () => {
    const result = adminProductSchema.parse({ ...validProduct, colors: "Noir, noir, Lavande" });
    expect(result.colors).toEqual(["Noir", "Lavande"]);
    expect(result.sizes).toEqual(["S", "M", "L", "XL"]);
    expect(result.priceDh).toBe(259);
    expect(result.initialStock).toBe(5);
  });

  it("rejects external or traversal image URLs and incomplete slugs", () => {
    expect(adminProductSchema.safeParse({ ...validProduct, image: "https://example.com/item.webp" }).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...validProduct, image: "/images/products/../outside.webp" }).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...validProduct, slug: "T-shirt Compression" }).success).toBe(false);
  });

  it("accepts Vercel Blob catalog images and defaults legacy product payloads to one image", () => {
    const blobImage = "https://store-123.public.blob.vercel-storage.com/products/123e4567-e89b-12d3-a456-426614174000.webp";
    const parsed = adminProductSchema.parse({ ...validProduct, image: blobImage, images: [blobImage] });
    expect(parsed.images).toEqual([blobImage]);
    expect(adminProductSchema.parse(validProduct).images).toEqual([validProduct.image]);
    expect(adminProductSchema.safeParse({ ...validProduct, image: "https://example.com/products/123.webp", images: ["https://example.com/products/123.webp"] }).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...validProduct, images: [validProduct.image, "/images/products/kinetic-graphic-tee.webp"], image: "/images/products/compression-core-black.webp" }).success).toBe(true);
    expect(adminProductSchema.safeParse({ ...validProduct, images: ["/images/products/compression-core-black.webp", ...Array(8).fill("/images/products/kinetic-graphic-tee.webp")] }).success).toBe(false);
  });

  it("caps generated variant combinations to 50", () => {
    expect(adminProductSchema.safeParse({ ...validProduct, colors: "Noir, Blanc, Lavande, Rouge, Bleu", sizes: "XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL, 6XL, 7XL, 8XL" }).success).toBe(false);
  });

  it("creates stable lowercase French slugs", () => {
    expect(slugifyProductName("T-Shirt Élite / Noir")).toBe("t-shirt-elite-noir");
  });
});

describe("inventory adjustment input", () => {
  it("requires a non-zero integer quantity and a reason", () => {
    expect(inventoryAdjustmentSchema.safeParse({ delta: 4, reason: "Réassort" }).success).toBe(true);
    expect(inventoryAdjustmentSchema.safeParse({ delta: -2, reason: "Correction" }).success).toBe(true);
    expect(inventoryAdjustmentSchema.safeParse({ delta: 0, reason: "Correction" }).success).toBe(false);
    expect(inventoryAdjustmentSchema.safeParse({ delta: 1.5, reason: "Correction" }).success).toBe(false);
    expect(inventoryAdjustmentSchema.safeParse({ delta: -1, reason: "ok" }).success).toBe(false);
  });
});
