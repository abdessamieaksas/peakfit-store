import { describe, expect, it } from "vitest";

import { sampleShippingZones } from "@/features/shipping/data/sample-shipping-zones";
import {
  normalizeCity,
  quoteFromZones,
} from "@/features/shipping/domain/quote";

describe("shipping quotes", () => {
  it("normalizes Moroccan city names", () => {
    expect(normalizeCity("  Fès  ")).toBe("fes");
    expect(normalizeCity("Salé")).toBe("sale");
  });

  it("uses the configured city zone", () => {
    const quote = quoteFromZones("Casablanca", 25900, sampleShippingZones);

    expect(quote.zoneCode).toBe("casa-rabat");
    expect(quote.fee).toBe(3500);
    expect(quote.estimatedDaysMax).toBe(2);
  });

  it("applies free shipping thresholds and a national fallback", () => {
    expect(quoteFromZones("Rabat", 70000, sampleShippingZones).fee).toBe(0);
    expect(quoteFromZones("Oujda", 25900, sampleShippingZones).zoneCode).toBe(
      "maroc",
    );
  });
});
