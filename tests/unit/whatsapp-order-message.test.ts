import { describe, expect, it } from "vitest";

import { buildWhatsAppOrderMessage } from "@/features/orders/domain/whatsapp-message";
import { formatMad } from "@/lib/money";

const order = {
  customerName: "Samir El Amrani",
  reference: "PF-260910-TEST1234",
  status: "NEW" as const,
  total: 38400,
  items: [
    {
      productName: "Compression Core Noir",
      variantTitle: "Noir / M",
      quantity: 2,
      lineTotal: 69800,
    },
  ],
};

describe("WhatsApp order message", () => {
  it("includes the order reference, item details, total, and confirmation request", () => {
    const message = buildWhatsAppOrderMessage(order);

    expect(message).toContain("Bonjour Samir, c’est Peakfit.");
    expect(message).toContain("PF-260910-TEST1234");
    expect(message).toContain(`Compression Core Noir — Noir / M ×2 (${formatMad(69800)})`);
    expect(message).toContain(`Total à régler à la livraison : ${formatMad(38400)}.`);
    expect(message).toContain("Peux-tu répondre OUI pour confirmer ta commande ?");
  });

  it("does not ask to confirm an already confirmed order", () => {
    const message = buildWhatsAppOrderMessage({ ...order, status: "CONFIRMED" });

    expect(message).toContain("Écris-nous si tu as une question");
    expect(message).not.toContain("répondre OUI");
  });
});
