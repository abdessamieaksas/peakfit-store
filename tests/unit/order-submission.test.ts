import { describe, expect, it } from "vitest";

import {
  CodOrderError,
  codOrderResultSchema,
  createCodOrderInputSchema,
} from "@/features/checkout/domain/order";
import { fingerprintCodOrder } from "@/features/checkout/server/fingerprint";
import { toPublicCodOrderError } from "@/features/checkout/server/public-error";

const firstVariant = "30000000-0000-4000-8000-000000000001";
const secondVariant = "30000000-0000-4000-8000-000000000002";

function command(items = [
  { variantId: firstVariant, quantity: 1 },
  { variantId: secondVariant, quantity: 2 },
]) {
  return createCodOrderInputSchema.parse({
    idempotencyKey: "89759f66-10c7-40be-b10e-a0035a74769b",
    customer: {
      fullName: "Sami Peakfit",
      phone: "+212612345678",
      email: "sami@example.com",
    },
    delivery: {
      city: "Casablanca",
      addressLine: "12 rue du Sport",
    },
    items,
    contactConsent: true,
  });
}

describe("COD order submission", () => {
  it("uses a stable fingerprint independent of cart-line order", () => {
    const forward = command();
    const reversed = command([...forward.items].reverse());

    expect(fingerprintCodOrder(forward)).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprintCodOrder(reversed)).toBe(fingerprintCodOrder(forward));
  });

  it("changes the fingerprint when the order intent changes", () => {
    expect(
      fingerprintCodOrder(
        command([{ variantId: firstVariant, quantity: 2 }]),
      ),
    ).not.toBe(
      fingerprintCodOrder(
        command([{ variantId: firstVariant, quantity: 1 }]),
      ),
    );
  });

  it("maps domain failures to safe customer responses", () => {
    expect(
      toPublicCodOrderError(new CodOrderError("OUT_OF_STOCK", "raw")),
    ).toEqual({
      code: "OUT_OF_STOCK",
      status: 409,
      message: "Le stock vient de changer. Modifie la quantité puis réessaie.",
    });

    const unknown = toPublicCodOrderError(
      new Error("DATABASE_URL and secret internals"),
    );
    expect(unknown.code).toBe("SERVICE_UNAVAILABLE");
    expect(unknown.message).not.toContain("DATABASE_URL");
  });

  it("accepts a replay whose order has advanced beyond NEW", () => {
    expect(
      codOrderResultSchema.parse({
        reference: "PF-260909-ABC12345",
        status: "CONTACTED",
        currency: "MAD",
        subtotal: 25900,
        shippingFee: 3500,
        total: 29400,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
        reservationExpiresAt: "2026-09-10T12:00:00.000Z",
        duplicate: true,
      }).status,
    ).toBe("CONTACTED");
  });
});
