"use client";

import { Check, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  CatalogProduct,
  CatalogVariant,
} from "@/features/catalog/domain/types";
import { useCart } from "@/features/cart/cart-context";

function matchesSelection(
  variant: CatalogVariant,
  selection: Record<string, string>,
) {
  return Object.entries(selection).every(
    ([code, value]) => variant.optionValues[code] === value,
  );
}

export function ProductPurchasePanel({ product }: { product: CatalogProduct }) {
  const initialVariant =
    product.variants.find((variant) => variant.availableQuantity > 0) ??
    product.variants[0];
  const [selection, setSelection] = useState<Record<string, string>>(
    initialVariant?.optionValues ?? {},
  );
  const { addLine } = useCart();
  const selectedVariant = product.variants.find(
    (variant) =>
      variant.availableQuantity > 0 && matchesSelection(variant, selection),
  );

  function isOptionAvailable(optionCode: string, valueCode: string) {
    const candidate = { ...selection, [optionCode]: valueCode };
    return product.variants.some(
      (variant) =>
        variant.availableQuantity > 0 && matchesSelection(variant, candidate),
    );
  }

  function addToCart() {
    if (!selectedVariant) return;

    const selectedOptions = product.options.flatMap((option) => {
      const selectedValue = option.values.find(
        (value) => value.code === selection[option.code],
      );

      return selectedValue
        ? [
            {
              code: option.code,
              name: option.name,
              value: selectedValue.code,
              label: selectedValue.label,
            },
          ]
        : [];
    });

    addLine({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: selectedVariant.price,
      variantTitle: selectedVariant.title,
      options: selectedOptions,
    });
    toast.success(`${product.name} ajouté au panier`, {
      description: selectedOptions.map((option) => option.label).join(" · "),
    });
  }

  return (
    <div>
      {product.options.map((option, optionIndex) => (
        <fieldset key={option.code} className={optionIndex ? "mt-6" : undefined}>
          <legend className="text-sm font-extrabold">
            Choisir {option.name.toLocaleLowerCase("fr-MA")}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {option.values.map((value) => {
              const selected = selection[option.code] === value.code;
              const available = isOptionAvailable(option.code, value.code);

              return (
                <button
                  key={value.code}
                  type="button"
                  className={`inline-flex min-h-11 min-w-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface hover:border-foreground"
                  }`}
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => {
                    if (!available) return;
                    setSelection((current) => ({
                      ...current,
                      [option.code]: value.code,
                    }));
                  }}
                >
                  {value.swatch ? (
                    <span
                      aria-hidden="true"
                      className="size-4 rounded-full border border-border"
                      style={{ backgroundColor: value.swatch }}
                    />
                  ) : null}
                  {value.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <p
        className={`mt-5 flex items-center gap-2 text-sm ${selectedVariant ? "text-success" : "text-danger"}`}
        role="status"
      >
        {selectedVariant ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <X aria-hidden="true" className="size-4" />
        )}
        {selectedVariant
          ? "Disponible — expédition rapide"
          : "Cette combinaison est momentanément indisponible"}
      </p>
      <Button
        type="button"
        size="lg"
        className="mt-6 w-full"
        disabled={!selectedVariant}
        onClick={addToCart}
      >
        <ShoppingBag aria-hidden="true" className="size-5" />
        {selectedVariant ? "Ajouter au panier" : "Indisponible"}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Paiement à la livraison. Le stock et le total seront revérifiés avant
        confirmation.
      </p>
    </div>
  );
}
