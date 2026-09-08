"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CatalogProduct } from "@/features/catalog/domain/types";

import { ProductCard } from "./product-card";

type ProductTab = "new" | "best";

export function FeaturedProducts({
  products: initialProducts,
}: {
  products: CatalogProduct[];
}) {
  const [tab, setTab] = useState<ProductTab>("new");
  const products = useMemo(() => {
    const sorted = [...initialProducts];
    if (tab === "best") {
      sorted.sort((a, b) => Number(b.badge === "Best-seller") - Number(a.badge === "Best-seller"));
    }
    return sorted;
  }, [initialProducts, tab]);

  return (
    <section className="page-shell py-16 sm:py-20" aria-labelledby="featured-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
            Sélection Peakfit
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`font-display text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl ${tab === "new" ? "text-foreground" : "text-muted"}`}
              aria-pressed={tab === "new"}
              onClick={() => setTab("new")}
            >
              Nouveautés
            </button>
            <span className="h-8 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              className={`text-sm font-extrabold sm:text-base ${tab === "best" ? "text-foreground" : "text-muted"}`}
              aria-pressed={tab === "best"}
              onClick={() => setTab("best")}
            >
              Best-sellers
            </button>
          </div>
        </div>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center gap-2 font-bold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Voir tous les produits
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
