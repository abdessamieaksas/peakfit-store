"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/features/catalog/domain/types";
import { useCart } from "@/features/cart/cart-context";

export function ProductPurchasePanel({ product }: { product: CatalogProduct }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const { addLine } = useCart();

  function addToCart() {
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      size,
      color,
    });
    toast.success(`${product.name} ajouté au panier`, {
      description: `${color} · Taille ${size}`,
    });
  }

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-extrabold">Choisir la taille</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              className={`inline-flex min-h-11 min-w-12 items-center justify-center rounded-md border px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                option === size
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-foreground"
              }`}
              aria-pressed={option === size}
              onClick={() => setSize(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className="text-sm font-extrabold">Choisir la couleur</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.colors.map((option) => (
            <button
              key={option}
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                option === color
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-foreground"
              }`}
              aria-pressed={option === color}
              onClick={() => setColor(option)}
            >
              <span
                aria-hidden="true"
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: colorValue(option) }}
              />
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mt-5 flex items-center gap-2 text-sm text-success">
        <Check aria-hidden="true" className="size-4" />
        Disponible — expédition rapide
      </p>
      <Button type="button" size="lg" className="mt-6 w-full" onClick={addToCart}>
        <ShoppingBag aria-hidden="true" className="size-5" />
        Ajouter au panier
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Paiement à la livraison. Le stock et le total seront revérifiés avant confirmation.
      </p>
    </div>
  );
}

function colorValue(color: string) {
  const values: Record<string, string> = {
    Noir: "#09090b",
    Blanc: "#f7f6f8",
    Lavande: "#b8a2ff",
  };

  return values[color] ?? "#67636d";
}
