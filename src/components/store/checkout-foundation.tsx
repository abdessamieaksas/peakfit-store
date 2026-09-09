"use client";

import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-context";
import { formatMad } from "@/lib/money";

type Errors = Partial<Record<"name" | "phone" | "city" | "address", string>>;

export function CheckoutFoundation() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const { lines, total } = useCart();

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Errors = {};

    if (!String(data.get("name") ?? "").trim()) nextErrors.name = "Indique ton nom complet.";
    if (!/^\+?[0-9\s-]{9,18}$/.test(String(data.get("phone") ?? ""))) {
      nextErrors.phone = "Indique un numéro de téléphone valide.";
    }
    if (!String(data.get("city") ?? "").trim()) nextErrors.city = "Indique ta ville.";
    if (!String(data.get("address") ?? "").trim()) nextErrors.address = "Indique ton adresse de livraison.";

    setErrors(nextErrors);
    setFormError("");
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(`checkout-${firstError}`)?.focus();
      return;
    }

    if (!lines.length) {
      setFormError("Ton panier est vide. Ajoute un produit avant de finaliser.");
      return;
    }

    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const note = String(data.get("note") ?? "").trim();
    const items = lines
      .map(
        (line) =>
          `• ${line.name} — ${line.variantTitle} × ${line.quantity} (${formatMad(line.price * line.quantity)})`,
      )
      .join("\n");
    const message = [
      "Bonjour Peakfit, je souhaite confirmer cette commande :",
      "",
      items,
      "",
      `Sous-total : ${formatMad(total)}`,
      `Nom : ${name}`,
      `Téléphone : ${phone}`,
      `Ville : ${city}`,
      `Adresse : ${address}`,
      note ? `Note : ${note}` : "",
      "",
      "Merci de me confirmer le tarif de livraison et la disponibilité.",
    ]
      .filter(Boolean)
      .join("\n");
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "212600000000";

    window.location.assign(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    );
  }

  return (
    <form className="grid gap-5" onSubmit={validate} noValidate>
      <div className="border border-accent-strong/30 bg-accent/10 p-4 text-sm">
        <p className="font-extrabold">Confirmation rapide sur WhatsApp</p>
        <p className="mt-1 leading-relaxed text-muted">
          Un conseiller Peakfit vérifiera la disponibilité, la livraison et le total avec toi avant l&apos;expédition.
        </p>
      </div>
      {formError ? (
        <p className="border border-danger/35 bg-danger/10 p-4 text-sm font-bold text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <Field id="name" label="Nom complet" autoComplete="name" error={errors.name} />
      <Field id="phone" label="Téléphone" autoComplete="tel" inputMode="tel" error={errors.phone} />
      <Field id="city" label="Ville" autoComplete="address-level2" error={errors.city} />
      <div>
        <label htmlFor="checkout-address" className="text-sm font-extrabold">Adresse de livraison</label>
        <textarea
          id="checkout-address"
          name="address"
          autoComplete="street-address"
          rows={4}
          aria-invalid={Boolean(errors.address)}
          aria-describedby={errors.address ? "checkout-address-error" : undefined}
          className="mt-2 w-full resize-none rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        />
        {errors.address ? <p id="checkout-address-error" role="alert" className="mt-2 text-sm text-danger">{errors.address}</p> : null}
      </div>
      <div>
        <label htmlFor="checkout-note" className="text-sm font-extrabold">Note de livraison <span className="font-normal text-muted">(facultatif)</span></label>
        <textarea
          id="checkout-note"
          name="note"
          rows={3}
          className="mt-2 w-full resize-none rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full">
        <MessageCircle aria-hidden="true" className="size-5" />
        Finaliser sur WhatsApp
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted">
        Aucune somme ne sera débitée. Le paiement se fait à la livraison.
      </p>
    </form>
  );
}

type FieldProps = {
  id: "name" | "phone" | "city";
  label: string;
  autoComplete: string;
  inputMode?: "tel";
  error?: string;
};

function Field({ id, label, error, ...props }: FieldProps) {
  const inputId = `checkout-${id}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-extrabold">{label}</label>
      <input
        id={inputId}
        name={id}
        type="text"
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
