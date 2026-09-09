import { describe, expect, it } from "vitest";

import {
  createCodOrderInputSchema,
  normalizeMoroccanPhone,
} from "@/features/checkout/domain/order";

const validOrder = {
  idempotencyKey: "89759f66-10c7-40be-b10e-a0035a74769b",
  customer: {
    fullName: "  Sami Peakfit  ",
    phone: "06 12 34 56 78",
    email: "  SAMI@example.com ",
  },
  delivery: {
    city: " Casablanca ",
    addressLine: " 12 rue du Sport ",
    note: " Appeler avant la livraison ",
  },
  items: [
    {
      variantId: "30000000-0000-4000-8000-000000000001",
      quantity: 2,
    },
  ],
};

describe("COD checkout contract", () => {
  it("normalizes Moroccan phone formats", () => {
    expect(normalizeMoroccanPhone("06 12 34 56 78")).toBe("+212612345678");
    expect(normalizeMoroccanPhone("00212 7 12 34 56 78")).toBe(
      "+212712345678",
    );
    expect(normalizeMoroccanPhone("+33 6 12 34 56 78")).toBeNull();
  });

  it("normalizes safe customer and delivery values", () => {
    const result = createCodOrderInputSchema.parse(validOrder);

    expect(result.customer).toEqual({
      fullName: "Sami Peakfit",
      phone: "+212612345678",
      email: "sami@example.com",
    });
    expect(result.delivery.city).toBe("Casablanca");
    expect(result.delivery.note).toBe("Appeler avant la livraison");
  });

  it("rejects duplicated variants", () => {
    const result = createCodOrderInputSchema.safeParse({
      ...validOrder,
      items: [validOrder.items[0], { ...validOrder.items[0] }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("plusieurs fois");
  });

  it("rejects client-controlled prices and malformed quantities", () => {
    expect(
      createCodOrderInputSchema.safeParse({
        ...validOrder,
        items: [{ ...validOrder.items[0], price: 1 }],
      }).success,
    ).toBe(false);

    expect(
      createCodOrderInputSchema.safeParse({
        ...validOrder,
        items: [{ ...validOrder.items[0], quantity: 11 }],
      }).success,
    ).toBe(false);
  });

  it("accepts an omitted optional email but rejects the honeypot", () => {
    expect(
      createCodOrderInputSchema.safeParse({
        ...validOrder,
        customer: { ...validOrder.customer, email: "" },
      }).success,
    ).toBe(true);

    expect(
      createCodOrderInputSchema.safeParse({
        ...validOrder,
        website: "spam.example",
      }).success,
    ).toBe(false);
  });
});
