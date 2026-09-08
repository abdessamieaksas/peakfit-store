"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { CatalogProduct } from "@/features/catalog/domain/types";
import { formatMad } from "@/lib/money";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const [favorite, setFavorite] = useState(false);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-raised">
        <Link
          href={`/produits/${product.slug}`}
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          aria-label={`Voir ${product.name}`}
        />
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-foreground px-3 py-1 text-[0.6875rem] font-extrabold text-background sm:text-xs">
            {product.badge}
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-2 top-2 z-20 inline-flex size-11 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={
            favorite
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          aria-pressed={favorite}
          onClick={() => setFavorite((current) => !current)}
        >
          <Heart
            aria-hidden="true"
            className={`size-5 ${favorite ? "fill-accent text-accent-strong" : ""}`}
          />
        </button>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold tracking-[-0.02em] sm:text-base">
              <Link
                href={`/produits/${product.slug}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 hidden text-xs leading-relaxed text-muted sm:block">
              {product.summary}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-extrabold tabular-nums sm:text-base">
              {formatMad(product.price)}
            </p>
            {product.compareAtPrice ? (
              <p className="text-xs text-muted line-through tabular-nums">
                {formatMad(product.compareAtPrice)}
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
          {product.colors.join(" · ")}
        </p>
      </div>
    </article>
  );
}
