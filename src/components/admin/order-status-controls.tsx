"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from "@/features/orders/domain/status";

const errorMessages: Record<string, string> = {
  VERSION_CONFLICT: "La commande a changé. La page va être actualisée.",
  INVALID_TRANSITION: "Ce changement de statut n’est pas autorisé.",
  RESERVATION_EXPIRED: "La réservation de stock a expiré. Vérifie le stock avant de confirmer.",
  UNAUTHORIZED: "Ta session a expiré. Reconnecte-toi.",
  FORBIDDEN: "Ton rôle ne permet pas de modifier les commandes.",
};

export function OrderStatusControls({
  orderId,
  status,
  version,
  canManage,
}: {
  orderId: string;
  status: OrderStatus;
  version: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const transitions = ORDER_TRANSITIONS[status];

  if (!transitions.length) {
    return <p className="text-sm text-muted">Cette commande est dans un état final.</p>;
  }

  async function updateStatus(nextStatus: OrderStatus) {
    setPending(nextStatus);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version, nextStatus }),
      });
      const body = (await response.json()) as { error?: { code?: string } };
      if (!response.ok) {
        const code = body.error?.code ?? "SERVICE_UNAVAILABLE";
        throw new Error(code);
      }
      toast.success(`Commande ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}.`);
      router.refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
      toast.error(errorMessages[code] ?? "Impossible de modifier la commande pour le moment.");
      if (code === "VERSION_CONFLICT") router.refresh();
      if (code === "UNAUTHORIZED") router.replace("/admin/connexion");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {transitions.map((nextStatus) => {
        const destructive = nextStatus === "CANCELLED" || nextStatus === "REFUSED";
        return (
          <Button
            key={nextStatus}
            type="button"
            variant={destructive ? "outline" : "accent"}
            disabled={!canManage || pending !== null}
            onClick={() => updateStatus(nextStatus)}
          >
            {pending === nextStatus ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {ORDER_STATUS_LABELS[nextStatus]}
          </Button>
        );
      })}
    </div>
  );
}
