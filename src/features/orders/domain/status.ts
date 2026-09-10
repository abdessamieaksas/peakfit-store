export const ORDER_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUSED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  CONTACTED: "Client contacté",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUSED: "Refusée",
  RETURNED: "Retournée",
};

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: ["CONTACTED", "CONFIRMED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "CANCELLED", "REFUSED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUSED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  REFUSED: [],
  RETURNED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
