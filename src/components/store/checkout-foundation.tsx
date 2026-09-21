"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-context";
import { saveOrderConfirmation } from "@/features/checkout/client/confirmation-storage";
import {
  codOrderResultSchema,
  createCodOrderInputSchema,
} from "@/features/checkout/domain/order";
import { normalizeCity } from "@/features/shipping/domain/quote";
import { formatMad } from "@/lib/money";

type FieldName =
  | "name"
  | "phone"
  | "email"
  | "city"
  | "region"
  | "address"
  | "postalCode"
  | "note"
  | "contactConsent";

type Errors = Partial<Record<FieldName, string>>;

const pathToField: Record<string, FieldName> = {
  "customer.fullName": "name",
  "customer.phone": "phone",
  "customer.email": "email",
  "delivery.city": "city",
  "delivery.region": "region",
  "delivery.addressLine": "address",
  "delivery.postalCode": "postalCode",
  "delivery.note": "note",
  contactConsent: "contactConsent",
};

type OrderApiError = {
  error?: {
    message?: string;
    issues?: Array<{ path?: string; message?: string }>;
  };
};

export function CheckoutFoundation() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const { lines, total, shippingQuote, clearCart } = useCart();
  const [deliveryCity, setDeliveryCity] = useState(
    () => shippingQuote?.city ?? "",
  );
  const quoteMatchesDeliveryCity = Boolean(
    shippingQuote &&
      normalizeCity(deliveryCity) === normalizeCity(shippingQuote.city),
  );
  const estimatedTotal =
    total + (quoteMatchesDeliveryCity ? shippingQuote?.fee ?? 0 : 0);

  function focusFirstError(nextErrors: Errors) {
    const firstError = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (!firstError) return;

    window.requestAnimationFrame(() => {
      document.getElementById(`checkout-${firstError}`)?.focus();
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lines.length) {
      setFormError("Ton panier est vide. Ajoute un produit avant de finaliser.");
      return;
    }

    const data = new FormData(event.currentTarget);
    idempotencyKey.current ??= crypto.randomUUID();

    const input = {
      idempotencyKey: idempotencyKey.current,
      customer: {
        fullName: data.get("name"),
        phone: data.get("phone"),
        email: data.get("email"),
      },
      delivery: {
        city: data.get("city"),
        region: data.get("region"),
        addressLine: data.get("address"),
        postalCode: data.get("postalCode"),
        note: data.get("note"),
      },
      items: lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      contactConsent: data.get("contactConsent") === "on",
      website: data.get("website"),
    };

    const parsed = createCodOrderInputSchema.safeParse(input);
    if (!parsed.success) {
      const nextErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = pathToField[issue.path.join(".")];
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setFormError(
        Object.keys(nextErrors).length
          ? "Vérifie les champs indiqués."
          : "Vérifie les informations de la commande.",
      );
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = body as OrderApiError | null;
        const nextErrors: Errors = {};
        for (const issue of apiError?.error?.issues ?? []) {
          const field = issue.path ? pathToField[issue.path] : undefined;
          if (field && issue.message && !nextErrors[field]) {
            nextErrors[field] = issue.message;
          }
        }
        setErrors(nextErrors);
        setFormError(
          apiError?.error?.message ??
            "La commande n’a pas pu être envoyée. Réessaie dans un instant.",
        );
        focusFirstError(nextErrors);
        return;
      }

      const result = codOrderResultSchema.safeParse(
        (body as { order?: unknown } | null)?.order,
      );
      if (!result.success) {
        setFormError(
          "La confirmation reçue est incomplète. Réessaie dans un instant.",
        );
        return;
      }

      saveOrderConfirmation(result.data);
      clearCart();
      router.push("/commande/merci");
    } catch {
      setFormError(
        "Connexion interrompue. Ta commande n’est pas perdue : réessaie avec le même bouton.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={submitOrder}
      onChange={() => {
        if (!isSubmitting) idempotencyKey.current = null;
      }}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className="border border-accent-strong/30 bg-accent/10 p-4 text-sm">
        <p className="font-extrabold">Confirmation automatique</p>
        <p className="mt-1 leading-relaxed text-muted">
          Envoie ta commande ici. Peakfit la reçoit immédiatement et te contacte
          ensuite pour confirmer la livraison — aucun message à envoyer toi-même.
        </p>
      </div>

      {formError ? (
        <div
          className="border border-danger/35 bg-danger/10 p-4 text-sm"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-extrabold">La commande n’est pas encore finalisée</p>
          <p className="mt-1 leading-relaxed text-danger">{formError}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nom complet" autoComplete="name" error={errors.name} required />
        <Field
          id="phone"
          label="Téléphone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="06 12 34 56 78"
          error={errors.phone}
          required
        />
      </div>

      <Field
        id="email"
        label="E-mail"
        hint="facultatif — pour recevoir la confirmation"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="city"
          label="Ville"
          autoComplete="address-level2"
          value={deliveryCity}
          onChange={(event) => setDeliveryCity(event.target.value)}
          error={errors.city}
          required
        />
        <Field
          id="region"
          label="Région"
          hint="facultatif"
          autoComplete="address-level1"
          error={errors.region}
        />
      </div>

      <TextAreaField
        id="address"
        label="Adresse de livraison"
        autoComplete="street-address"
        rows={4}
        error={errors.address}
        required
      />

      <Field
        id="postalCode"
        label="Code postal"
        hint="facultatif"
        autoComplete="postal-code"
        inputMode="numeric"
        error={errors.postalCode}
      />

      <TextAreaField
        id="note"
        label="Note de livraison"
        hint="facultatif"
        rows={3}
        error={errors.note}
      />

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="checkout-website">Site web</label>
        <input id="checkout-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label
          htmlFor="checkout-contactConsent"
          className="flex cursor-pointer items-start gap-3 border border-border bg-surface p-4 text-sm"
        >
          <input
            id="checkout-contactConsent"
            name="contactConsent"
            type="checkbox"
            required
            aria-invalid={Boolean(errors.contactConsent)}
            aria-describedby={errors.contactConsent ? "checkout-contactConsent-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-[var(--accent-strong)]"
          />
          <span className="leading-relaxed">
            J’accepte que Peakfit me contacte par téléphone, e-mail ou WhatsApp
            uniquement au sujet de cette commande.
          </span>
        </label>
        {errors.contactConsent ? (
          <p id="checkout-contactConsent-error" role="alert" className="mt-2 text-sm text-danger">
            {errors.contactConsent}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        variant="accent"
        className="mt-2 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <LockKeyhole aria-hidden="true" className="size-5" />
        )}
        {isSubmitting ? "Envoi sécurisé…" : `Confirmer — ${formatMad(estimatedTotal)}`}
      </Button>
      {quoteMatchesDeliveryCity && shippingQuote ? (
        <p className="text-center text-xs leading-relaxed text-muted">
          Total estimé pour {shippingQuote.city}, livraison incluse. Le montant
          final est revérifié à la commande.
        </p>
      ) : null}
      <p className="text-center text-xs leading-relaxed text-muted">
        Aucun débit maintenant. Tu règles en espèces à la réception du colis.
      </p>
    </form>
  );
}

type FieldProps = {
  id: Exclude<FieldName, "address" | "note" | "contactConsent">;
  label: string;
  hint?: string;
  type?: "text" | "email";
  autoComplete: string;
  inputMode?: "tel" | "email" | "numeric";
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
};

function Field({ id, label, hint, error, type = "text", ...props }: FieldProps) {
  const inputId = `checkout-${id}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-extrabold">
        {label} {hint ? <span className="font-normal text-muted">({hint})</span> : null}
      </label>
      <input
        id={inputId}
        name={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

type TextAreaFieldProps = {
  id: "address" | "note";
  label: string;
  hint?: string;
  rows: number;
  autoComplete?: string;
  error?: string;
  required?: boolean;
};

function TextAreaField({ id, label, hint, error, ...props }: TextAreaFieldProps) {
  const inputId = `checkout-${id}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-extrabold">
        {label} {hint ? <span className="font-normal text-muted">({hint})</span> : null}
      </label>
      <textarea
        id={inputId}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 w-full resize-none rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
