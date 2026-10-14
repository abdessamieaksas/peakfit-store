import { describe, expect, it } from "vitest";

import { buildCodOrderWhatsAppUrl } from "@/features/checkout/domain/whatsapp";

describe("customer-assisted WhatsApp checkout", () => {
  it("builds a wa.me draft from canonical order details without a street address", () => {
    const url = buildCodOrderWhatsAppUrl(
      {
        reference: "PF-261014-ABC12345",
        customerName: "Sami Test",
        customerPhone: "+212612345678",
        city: "Casablanca",
        items: [
          {
            productName: "Compression Core",
            variantTitle: "Noir / M",
            selectedOptions: [
              { name: "Couleur", label: "Noir" },
              { name: "Taille", label: "M" },
            ],
            quantity: 2,
            unitPrice: 34900,
          },
        ],
        total: 69800,
      },
      "212 719 427 447",
    );
    const parsed = new URL(url);
    const message = parsed.searchParams.get("text") ?? "";

    expect(parsed.origin + parsed.pathname).toBe("https://wa.me/212719427447");
    expect(message).toContain("PF-261014-ABC12345");
    expect(message).toContain("Compression Core — Noir / M · Couleur : Noir · Taille : M | Qté : 2 | 698 MAD");
    expect(message).toContain("Taille : M");
    expect(message).toContain("Total (livraison offerte) : 698 MAD");
    expect(message).toContain("+212612345678");
    expect(message).not.toContain("rue");
  });

  it("rejects an invalid business number", () => {
    expect(() =>
      buildCodOrderWhatsAppUrl(
        {
          reference: "PF-261014-ABC12345",
          customerName: "Sami",
          customerPhone: "+212612345678",
          city: "Rabat",
          items: [],
          total: 0,
        },
        "not-a-number",
      ),
    ).toThrow("Invalid WhatsApp number");
  });
});
