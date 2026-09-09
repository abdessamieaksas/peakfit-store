"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ShippingEstimator } from "@/components/store/shipping-estimator";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-context";
import type { ShippingQuote } from "@/features/shipping/domain/types";
import { formatMad } from "@/lib/money";
import { cn } from "@/lib/utils";

export function CartView() {
  const { lines, total, removeLine, setQuantity } = useCart();
  const [shippingEstimate, setShippingEstimate] = useState<{
    subtotal: number;
    quote: ShippingQuote;
  } | null>(null);
  const shippingQuote =
    shippingEstimate?.subtotal === total ? shippingEstimate.quote : null;

  if (!lines.length) {
    return (
      <div className="border-y border-border py-16 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
          0 article
        </p>
        <h2 className="display-title mt-3 text-5xl sm:text-7xl">Ton panier est vide</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Commence par une pièce essentielle. Ta sélection restera sur cet appareil.
        </p>
        <Link
          href="/shop"
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-7")}
        >
          Explorer le shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <ul className="divide-y divide-border border-y border-border">
        {lines.map((line) => (
          <li key={line.variantId} className="grid grid-cols-[6rem_1fr] gap-4 py-5 sm:grid-cols-[8rem_1fr]">
            <Link
              href={`/produits/${line.slug}`}
              className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Image src={line.image} alt="" fill sizes="8rem" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/produits/${line.slug}`}
                    className="font-extrabold hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {line.options
                      .map((option) => `${option.name} ${option.label}`)
                      .join(" · ")}
                  </p>
                </div>
                <p className="shrink-0 font-extrabold tabular-nums">
                  {formatMad(line.price * line.quantity)}
                </p>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <div className="inline-flex items-center rounded-md border border-border bg-surface">
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-l-md hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    aria-label={`Réduire la quantité de ${line.name}`}
                    onClick={() =>
                      setQuantity(
                        line.variantId,
                        line.quantity - 1,
                      )
                    }
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </button>
                  <span className="min-w-9 text-center text-sm font-extrabold tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-r-md hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Augmenter la quantité de ${line.name}`}
                    onClick={() =>
                      setQuantity(
                        line.variantId,
                        line.quantity + 1,
                      )
                    }
                    disabled={line.quantity >= 10}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  onClick={() => removeLine(line.variantId)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Retirer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit border border-border bg-surface p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">Résumé</h2>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Sous-total</dt>
            <dd className="font-bold tabular-nums">{formatMad(total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Livraison</dt>
            <dd className="font-bold tabular-nums">
              {shippingQuote
                ? shippingQuote.isFree
                  ? "Offerte"
                  : formatMad(shippingQuote.fee)
                : "À estimer"}
            </dd>
          </div>
        </dl>
        <div className="my-5 h-px bg-border" />
        <div className="flex justify-between gap-4 text-lg font-extrabold">
          <span>{shippingQuote ? "Total estimé" : "Total provisoire"}</span>
          <span className="tabular-nums">
            {formatMad(total + (shippingQuote?.fee ?? 0))}
          </span>
        </div>
        <ShippingEstimator
          subtotal={total}
          onQuoteChange={(quote) =>
            setShippingEstimate(quote ? { subtotal: total, quote } : null)
          }
        />
        <Link
          href="/commande"
          className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-6 w-full")}
        >
          Passer la commande
        </Link>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          Aucun paiement en ligne. Tu règles à la livraison après confirmation.
        </p>
      </aside>
    </div>
  );
}
