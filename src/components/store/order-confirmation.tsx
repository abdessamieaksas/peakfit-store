"use client";

import { CheckCircle2, PackageCheck, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button";
import { loadOrderConfirmation } from "@/features/checkout/client/confirmation-storage";
import type { CodOrderResult } from "@/features/checkout/domain/order";
import { formatMad } from "@/lib/money";
import { cn } from "@/lib/utils";

const subscribeToHydration = () => () => undefined;

export function OrderConfirmation() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const order = useMemo<CodOrderResult | null | undefined>(
    () => (isHydrated ? loadOrderConfirmation() : undefined),
    [isHydrated],
  );

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-2xl border border-border bg-surface p-7 sm:p-10">
        <div className="h-5 w-40 animate-pulse bg-surface-raised" />
        <div className="mt-5 h-16 animate-pulse bg-surface-raised" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl border border-border bg-surface p-7 text-center sm:p-10">
        <PackageCheck aria-hidden="true" className="mx-auto size-10 text-accent-strong" />
        <h1 className="mt-5 font-display text-5xl font-extrabold uppercase tracking-[-0.04em]">
          Confirmation introuvable
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Cette page affiche la dernière commande finalisée sur cet appareil.
          Consulte ton e-mail ou contacte Peakfit si tu as déjà commandé.
        </p>
        <Link href="/shop" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-7")}>
          Retour au shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="border border-success/35 bg-success/10 p-7 sm:p-10">
        <CheckCircle2 aria-hidden="true" className="size-11 text-success" />
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-success">
          Commande enregistrée
        </p>
        <h1 className="display-title mt-3 text-[clamp(3.5rem,10vw,7rem)]">
          C’est confirmé
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Merci. L’équipe Peakfit a reçu ta commande et te contactera pour
          vérifier la livraison. Tu n’as aucun message à envoyer.
        </p>
      </div>

      <div className="grid border-x border-b border-border bg-surface sm:grid-cols-2">
        <div className="border-b border-border p-6 sm:border-r sm:border-b-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">Référence</p>
          <p className="mt-2 text-xl font-extrabold tracking-tight">{order.reference}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">Total à la livraison</p>
          <p className="mt-2 text-xl font-extrabold tabular-nums">{formatMad(order.total)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-border bg-surface p-5">
          <PhoneCall aria-hidden="true" className="size-6 text-accent-strong" />
          <p className="mt-4 font-extrabold">1. Confirmation Peakfit</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nous te contactons au numéro fourni pour confirmer la commande.
          </p>
        </div>
        <div className="border border-border bg-surface p-5">
          <PackageCheck aria-hidden="true" className="size-6 text-accent-strong" />
          <p className="mt-4 font-extrabold">2. Livraison & paiement</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Livraison estimée sous {order.estimatedDaysMin} à {order.estimatedDaysMax} jours.
            Paiement à la réception.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className={buttonVariants({ variant: "primary", size: "lg" })}>
          Continuer mes achats
        </Link>
        <Link href="/contact" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Besoin d’aide
        </Link>
      </div>
    </div>
  );
}
