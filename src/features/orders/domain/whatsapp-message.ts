import { formatMad } from "@/lib/money";

import type { OrderStatus } from "./status";

type WhatsAppOrderMessageInput = {
  customerName: string;
  reference: string;
  status: OrderStatus;
  total: number;
  items: Array<{
    productName: string;
    variantTitle: string;
    quantity: number;
    lineTotal: number;
  }>;
};

export function buildWhatsAppOrderMessage(order: WhatsAppOrderMessageInput) {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "";
  const items = order.items.map(
    (item) => `• ${item.productName} — ${item.variantTitle} ×${item.quantity} (${formatMad(item.lineTotal)})`,
  );
  const needsConfirmation = order.status === "NEW" || order.status === "CONTACTED";

  return [
    `Bonjour${firstName ? ` ${firstName}` : ""}, c’est Peakfit.`,
    `Nous avons bien reçu ta commande ${order.reference} :`,
    ...items,
    `Total à régler à la livraison : ${formatMad(order.total)}.`,
    needsConfirmation
      ? "Peux-tu répondre OUI pour confirmer ta commande ?"
      : "Écris-nous si tu as une question au sujet de ta commande.",
  ].join("\n");
}
