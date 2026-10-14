import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { CatalogProduct } from "@/features/catalog/domain/types";

import { ProductCard } from "./product-card";

export function FeaturedProducts({
  products: initialProducts,
}: {
  products: CatalogProduct[];
}) {
  return (
    <section className="page-shell py-16 sm:py-20" aria-labelledby="featured-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
            La sélection Peakfit
          </p>
          <h2 id="featured-title" className="font-display text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">
            Nos essentiels
          </h2>
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
        {initialProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
