import type { OrderStatus } from "@/features/orders/domain/status";
import { ORDER_STATUS_LABELS } from "@/features/orders/domain/status";
import { cn } from "@/lib/utils";

const statusClasses: Record<OrderStatus, string> = {
  NEW: "border-accent-strong/40 bg-accent/20 text-foreground",
  CONTACTED: "border-warning/35 bg-warning/10 text-warning",
  CONFIRMED: "border-success/35 bg-success/10 text-success",
  PREPARING: "border-foreground/20 bg-surface-raised text-foreground",
  SHIPPED: "border-accent-strong/40 bg-accent/15 text-accent-strong",
  DELIVERED: "border-success/35 bg-success/10 text-success",
  CANCELLED: "border-danger/35 bg-danger/10 text-danger",
  REFUSED: "border-danger/35 bg-danger/10 text-danger",
  RETURNED: "border-muted/35 bg-surface-raised text-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-extrabold", statusClasses[status])}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
