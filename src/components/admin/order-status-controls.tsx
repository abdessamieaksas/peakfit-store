"use client";

import * as Dialog from "@radix-ui/react-dialog";
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
  const [confirmingStatus, setConfirmingStatus] = useState<OrderStatus | null>(null);
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
      setConfirmingStatus(null);
      router.refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
      toast.error(errorMessages[code] ?? "Impossible de modifier la commande pour le moment.");
      if (
        code === "VERSION_CONFLICT" ||
        code === "INVALID_TRANSITION" ||
        code === "RESERVATION_EXPIRED"
      ) {
        setConfirmingStatus(null);
        router.refresh();
      }
      if (code === "UNAUTHORIZED") {
        setConfirmingStatus(null);
        router.replace("/connexion");
      }
    } finally {
      setPending(null);
    }
  }

  const isCancellation = confirmingStatus === "CANCELLED";
  const confirmationDetail =
    confirmingStatus === "CANCELLED"
      ? status === "NEW" || status === "CONTACTED"
        ? "La réservation de stock sera libérée."
        : "Le stock de cette commande sera remis en disponibilité."
      : status === "SHIPPED"
        ? "Confirme ce refus seulement si le colis est effectivement revenu en stock."
        : "La commande sera clôturée et son stock réservé libéré.";

  return (
    <Dialog.Root
      open={confirmingStatus !== null}
      onOpenChange={(open) => {
        if (!open && pending === null) setConfirmingStatus(null);
      }}
    >
      <div className="flex flex-wrap gap-3">
        {transitions.map((nextStatus) => {
          const destructive = nextStatus === "CANCELLED" || nextStatus === "REFUSED";
          return (
            <Button
              key={nextStatus}
              type="button"
              variant={destructive ? "outline" : "accent"}
              disabled={!canManage || pending !== null}
              onClick={() => {
                if (destructive) setConfirmingStatus(nextStatus);
                else void updateStatus(nextStatus);
              }}
            >
              {pending === nextStatus ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
              {ORDER_STATUS_LABELS[nextStatus]}
            </Button>
          );
        })}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/55"
          style={{ zIndex: "var(--z-backdrop)" }}
        />
        <Dialog.Content
          role="alertdialog"
          aria-describedby="order-status-confirmation-description"
          className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-surface p-6 shadow-2xl focus:outline-none"
          style={{ zIndex: "var(--z-dialog)" }}
          onEscapeKeyDown={(event) => {
            if (pending !== null) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (pending !== null) event.preventDefault();
          }}
        >
          <Dialog.Title className="font-display text-3xl font-extrabold uppercase">
            {isCancellation ? "Annuler cette commande ?" : "Confirmer le refus ?"}
          </Dialog.Title>
          <Dialog.Description
            id="order-status-confirmation-description"
            className="mt-3 text-sm leading-relaxed text-muted"
          >
            {confirmationDetail} Cette action sera inscrite dans l’historique et ne
            pourra pas être annulée depuis le tableau de bord.
          </Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={pending !== null}>
                Garder la commande
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="danger"
              disabled={pending !== null || confirmingStatus === null}
              onClick={() => {
                if (confirmingStatus) void updateStatus(confirmingStatus);
              }}
              aria-busy={pending !== null}
            >
              {pending === confirmingStatus ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {pending === confirmingStatus
                ? "Mise à jour…"
                : isCancellation
                  ? "Annuler la commande"
                  : "Confirmer le refus"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
