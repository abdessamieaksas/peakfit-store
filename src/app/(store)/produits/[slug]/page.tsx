import { ArrowLeft, Check, PackageCheck, RefreshCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import {
  sampleProducts,
} from "@/features/catalog/data/sample-catalog";
import { getCatalogProductBySlug } from "@/features/catalog/server/catalog-repository";
import { formatMad } from "@/lib/money";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sampleProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) return { title: "Produit introuvable" };

  return {
    title: product.name,
    description: product.summary,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="page-shell py-8 sm:py-12">
      <Link
        href="/shop"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour au shop
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)] lg:gap-14">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-raised">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover"
          />
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.badge ? (
            <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-on-accent">
              {product.badge}
            </p>
          ) : null}
          <h1 className="display-title mt-5 text-[clamp(4rem,8vw,7rem)]">
            {product.name}
          </h1>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-2xl font-extrabold tabular-nums">
              {formatMad(product.price)}
            </p>
            {product.compareAtPrice ? (
              <p className="text-sm text-muted line-through tabular-nums">
                {formatMad(product.compareAtPrice)}
              </p>
            ) : null}
          </div>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {product.description}
          </p>
          <ul className="my-8 grid gap-3 border-y border-border py-6 text-sm">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-strong" />
                {benefit}
              </li>
            ))}
          </ul>
          <ProductPurchasePanel product={product} />
          <div className="mt-8 grid gap-3 border-t border-border pt-6 text-xs text-muted sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <span className="flex items-center gap-2"><PackageCheck aria-hidden="true" className="size-4" />Paiement COD</span>
            <span className="flex items-center gap-2"><Truck aria-hidden="true" className="size-4" />Maroc entier</span>
            <span className="flex items-center gap-2"><RefreshCcw aria-hidden="true" className="size-4" />Échange 7 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
