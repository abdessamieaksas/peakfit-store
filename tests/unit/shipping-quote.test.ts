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

  it("keeps city delivery estimates while applying free delivery", () => {
    const quote = quoteFromZones("Casablanca", 25900, sampleShippingZones);

    expect(quote.zoneCode).toBe("casa-rabat");
    expect(quote.fee).toBe(0);
    expect(quote.isFree).toBe(true);
    expect(quote.estimatedDaysMax).toBe(2);
  });

  it("applies free delivery to all cities and basket values", () => {
    for (const city of ["Rabat", "Oujda"]) {
      const quote = quoteFromZones(city, 100, sampleShippingZones);
      expect(quote.fee).toBe(0);
      expect(quote.isFree).toBe(true);
    }
    expect(quoteFromZones("Oujda", 100, sampleShippingZones).zoneCode).toBe("maroc");
  });
});
