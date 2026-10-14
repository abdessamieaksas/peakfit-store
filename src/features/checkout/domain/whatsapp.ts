export type WhatsAppOrderItem = {
  productName: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  selectedOptions?: Array<{ name: string; label: string }>;
};

export type WhatsAppCodOrder = {
  reference: string;
  customerName: string;
  customerPhone: string;
  city: string;
  items: WhatsAppOrderItem[];
  total: number;
};

function cleanLine(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildCodOrderWhatsAppUrl(
  order: WhatsAppCodOrder,
  businessNumber: string,
) {
  const number = businessNumber.replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(number)) throw new Error("Invalid WhatsApp number.");

  const itemLines = order.items.map((item) => {
    const variant = cleanLine(item.variantTitle);
    const title = cleanLine(item.productName);
    const options = (item.selectedOptions ?? [])
      .map(({ name, label }) => `${cleanLine(name)} : ${cleanLine(label)}`)
      .filter((option) => !option.endsWith(": "));
    const variantDetails = [variant, ...options].filter(Boolean).join(" · ");
    return `- ${title}${variantDetails ? ` — ${variantDetails}` : ""} | Qté : ${item.quantity} | ${formatMad(item.unitPrice * item.quantity)}`;
  });

  const message = [
    "Bonjour Peakfit, je souhaite finaliser cette commande :",
    `Référence : ${cleanLine(order.reference)}`,
    `Nom : ${cleanLine(order.customerName)}`,
    `Téléphone : ${cleanLine(order.customerPhone)}`,
    `Ville : ${cleanLine(order.city)}`,
    "",
    "Articles :",
    ...itemLines,
    `Total (livraison offerte) : ${formatMad(order.total)}`,
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatMad(amount: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(amount / 100)} MAD`;
}
