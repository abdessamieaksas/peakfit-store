"use client";

import { CheckCircle2, MessageCircle, PackageCheck } from "lucide-react";
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
          C’est enregistré
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Merci. Ta commande est enregistrée dans notre système. WhatsApp peut
          s’ouvrir avec son récapitulatif ; vérifie-le et appuie sur « Envoyer »
          pour nous le transmettre. Aucun message n’est envoyé automatiquement.
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
          <MessageCircle aria-hidden="true" className="size-6 text-accent-strong" />
          <p className="mt-4 font-extrabold">1. Envoyer le récapitulatif</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Le message est préparé gratuitement dans WhatsApp. Il ne partira
            qu’après ton appui sur « Envoyer ».
          </p>
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-4 w-full")}
          >
            Continuer vers WhatsApp
          </a>
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
