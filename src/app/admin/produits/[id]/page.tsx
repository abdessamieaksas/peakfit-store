import { ArrowLeft, Box } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminProductForm, AdminVariantStockForm } from "@/components/admin/admin-product-form";
import { buttonVariants } from "@/components/ui/button";
import { getAdminProduct, listAdminProductCategories, listAdminStockHistory, listLocalProductImages } from "@/features/catalog/server/admin-product-repository";
import { isProductImageStorageReady } from "@/features/catalog/server/product-image-storage";
import { canManageCatalog, requireAdmin } from "@/lib/auth/access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gérer le produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdmin();
  if (!canManageCatalog(access.role)) return <><AdminHeader access={access} /><main className="page-shell py-16"><h1 className="font-display text-5xl font-extrabold uppercase">Accès réservé</h1><p className="mt-3 text-muted">Ton rôle ne permet pas de gérer le catalogue.</p></main></>;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories, images, stockHistory] = await Promise.all([getAdminProduct(id), listAdminProductCategories(), listLocalProductImages(), listAdminStockHistory(id)]);
  if (!product) notFound();
  return <>
    <AdminHeader access={access} />
    <main className="page-shell py-10 sm:py-14">
      <Link href="/admin/produits" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}><ArrowLeft aria-hidden="true" className="size-4" />Retour aux produits</Link>
      <div className="mt-5 border-b border-border pb-7"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Catalogue · {product.category}</p><h1 className="display-title mt-2 text-[clamp(3.6rem,9vw,6.5rem)]">{product.name}</h1><p className="mt-3 text-sm text-muted">{product.availableStock} disponible(s) après réservations · {product.totalStock} en stock</p></div>
      <>
        {product.status === "ARCHIVED" ? <section role="status" className="mt-8 border-l-2 border-warning bg-surface p-5"><h2 className="font-bold">Ce produit est archivé</h2><p className="mt-1 text-sm text-muted">La restauration n’est pas encore disponible. La fiche et son stock restent en lecture seule.</p></section> : <>
          <AdminProductForm categories={categories} images={images} product={product} canUploadImages={isProductImageStorageReady()} />
          <section aria-labelledby="variant-stock-heading" className="mt-12 border-t border-border pt-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Inventaire</p><h2 id="variant-stock-heading" className="mt-2 font-display text-4xl font-extrabold uppercase">Stock par variante</h2><p className="mt-2 text-sm text-muted">Les quantités réservées pour des commandes existantes ne peuvent pas être retirées du stock.</p>
          {product.variants.length ? <ul className="mt-6 divide-y divide-border border-y border-border">{product.variants.map((variant) => <li key={variant.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(12rem,1fr)_minmax(20rem,1.4fr)] lg:items-center">
            <div className="flex items-start gap-3"><Box aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-strong" /><div><h3 className="font-extrabold">{variant.title}</h3><p className="mt-1 text-xs text-muted">SKU {variant.sku}</p><p className="mt-2 text-sm"><strong>{variant.available}</strong> disponible · {variant.reserved} réservé · {variant.stock} total</p></div></div>
            <AdminVariantStockForm productId={product.id} variant={variant} />
          </li>)}</ul> : <p className="mt-5 text-sm text-muted">Aucune variante active sur cette fiche.</p>}
          </section>
        </>}
        <section aria-labelledby="stock-history-heading" className="mt-12 border-t border-border pt-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Traçabilité</p><h2 id="stock-history-heading" className="mt-2 font-display text-4xl font-extrabold uppercase">Historique du stock</h2>
          {stockHistory.length ? <ol className="mt-6 divide-y divide-border border-y border-border">{stockHistory.map((entry) => <li key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.5fr)_auto] sm:items-center">
            <div><p className="font-bold">{entry.variantTitle}</p><p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" }).format(new Date(entry.createdAt))} · {entry.actor}</p></div>
            <p className="text-sm text-muted">{entry.reason}</p>
            <p className={`text-sm font-extrabold tabular-nums ${entry.change > 0 ? "text-success" : "text-warning"}`}>{entry.change > 0 ? "+" : ""}{entry.change} · {entry.before} → {entry.after}</p>
          </li>)}</ol> : <p className="mt-5 border border-dashed border-border p-5 text-sm text-muted">Aucun ajustement n’a encore été enregistré.</p>}
          {stockHistory.length === 10 ? <p className="mt-3 text-xs text-muted">Affichage des 10 ajustements les plus récents.</p> : null}
        </section>
      </>
    </main>
  </>;
}
