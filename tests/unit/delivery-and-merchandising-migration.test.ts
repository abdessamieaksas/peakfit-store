import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const freeDeliveryMigration = readFileSync(
  resolve("drizzle/0005_peakfit_free_delivery.sql"),
  "utf8",
);
const honestMerchandisingMigration = readFileSync(
  resolve("drizzle/0006_peakfit_honest_merchandising.sql"),
  "utf8",
);

describe("storefront trust migrations", () => {
  it("sets every shipping zone to zero-fee delivery and enforces that invariant", () => {
    expect(freeDeliveryMigration).toContain(
      "SET free_shipping_threshold = 0",
    );
    expect(freeDeliveryMigration).toContain(
      "ALTER COLUMN free_shipping_threshold SET NOT NULL",
    );
    expect(freeDeliveryMigration).toContain(
      "CHECK (free_shipping_threshold = 0)",
    );
    expect(freeDeliveryMigration).toContain("Livraison gratuite partout au Maroc.");
  });

  it("removes unsupported seed popularity, freshness, and reference-price claims", () => {
    expect(honestMerchandisingMigration).toContain("badge:nouveau");
    expect(honestMerchandisingMigration).toContain("badge:best-seller");
    expect(honestMerchandisingMigration).toContain("compare_at_price = 55900 THEN NULL");
  });
});
