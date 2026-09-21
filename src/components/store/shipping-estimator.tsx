"use client";

import { LoaderCircle, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { ShippingQuote } from "@/features/shipping/domain/types";
import { formatMad } from "@/lib/money";

type ShippingEstimatorProps = {
  subtotal: number;
  quote: ShippingQuote | null;
  onQuoteChange: (quote: ShippingQuote | null) => void;
};

export function ShippingEstimator({
  subtotal,
  quote,
  onQuoteChange,
}: ShippingEstimatorProps) {
  const [city, setCity] = useState(() => quote?.city ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (city.trim().length < 2) {
      onQuoteChange(null);
      setError("Saisis une ville valide.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, subtotal }),
      });
      const payload = (await response.json()) as {
        quote?: ShippingQuote;
        error?: string;
      };

      if (!response.ok || !payload.quote) {
        throw new Error(payload.error ?? "Tarif indisponible.");
      }

      onQuoteChange(payload.quote);
    } catch (caught) {
      onQuoteChange(null);
      setError(
        caught instanceof Error ? caught.message : "Tarif indisponible.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate className="mt-6 border-t border-border pt-6" onSubmit={handleSubmit}>
      <label htmlFor="shipping-city" className="text-sm font-extrabold">
        Estimer la livraison
      </label>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Entre ta ville. Le tarif final sera recalculé à la commande.
      </p>
      <div className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="shipping-city"
            name="city"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              if (quote) {
                onQuoteChange(null);
              }
            }}
            autoComplete="address-level2"
            placeholder="Casablanca"
            aria-describedby="shipping-estimate-status"
            className="min-h-11 w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/25"
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            "Calculer"
          )}
        </Button>
      </div>
      <div id="shipping-estimate-status" className="mt-3 min-h-10 text-xs" aria-live="polite">
        {error ? <p className="font-bold text-danger">{error}</p> : null}
        {quote ? (
          <p className="leading-relaxed text-muted">
            <strong className="text-foreground">{quote.zoneName}</strong> · {quote.isFree ? "Offerte" : formatMad(quote.fee)} · {quote.estimatedDaysMin}–{quote.estimatedDaysMax} jours ouvrés
          </p>
        ) : null}
      </div>
    </form>
  );
}
