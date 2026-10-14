import { ArrowLeft, ArrowRight, PackagePlus, Plus } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { buttonVariants } from "@/components/ui/button";
import { listAdminProducts } from "@/features/catalog/server/admin-product-repository";
import { canManageCatalog, requireAdmin } from "@/lib/auth/access";
import { formatMad } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Produits et stock", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const pageSize = 20;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const access = await requireAdmin();
  const pageValue = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  if (!canManageCatalog(access.role)) {
    return <><AdminHeader access={access} /><main className="page-shell py-16"><h1 className="font-display text-5xl font-extrabold uppercase">Accès réservé</h1><p className="mt-3 text-muted">Le rôle de gestionnaire de catalogue est nécessaire pour ajouter des produits ou changer le stock.</p><Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Retour aux commandes</Link></main></>;
  }
  const { rows, total } = await listAdminProducts(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <>
    <AdminHeader access={access} />
    <main className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Catalogue</p><h1 className="display-title mt-2 text-[clamp(3.6rem,9vw,7rem)]">Produits & stock</h1><p className="mt-3 text-sm text-muted">Gère les fiches, la visibilité en boutique et le stock par variante.</p></div>
        <Link href="/admin/produits/nouveau" className={cn(buttonVariants({ variant: "accent" }), "w-fit")}><Plus aria-hidden="true" className="size-4" />Ajouter un produit</Link>
      </div>
      <section aria-label="Liste des produits" className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4"><p className="text-sm text-muted">{total} produit{total === 1 ? "" : "s"}</p><p className="text-xs text-muted">Page {page} sur {totalPages}</p></div>
        {rows.length ? <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-border bg-background text-xs font-extrabold uppercase tracking-[0.1em] text-muted"><tr><th scope="col" className="px-4 py-3">Produit</th><th scope="col" className="px-4 py-3">Catégorie</th><th scope="col" className="px-4 py-3">Prix</th><th scope="col" className="px-4 py-3">Stock disponible</th><th scope="col" className="px-4 py-3">Statut</th><th scope="col" className="px-4 py-3"><span className="sr-only">Ouvrir</span></th></tr></thead>
            <tbody className="divide-y divide-border">{rows.map((product) => <tr key={product.id} className="hover:bg-surface-raised">
              <td className="px-4 py-3"><Link href={`/admin/produits/${product.id}`} className="inline-flex min-h-11 items-center gap-3 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden border border-border bg-background">{product.image ? <Image src={product.image} alt="" fill sizes="48px" className="object-cover" /> : <PackagePlus aria-hidden="true" className="size-5 text-muted" />}</span>
                <span><span className="block">{product.name}</span><span className="block text-xs font-normal text-muted">{product.variantCount} variante{product.variantCount === 1 ? "" : "s"}</span></span>
              </Link></td>
              <td className="px-4 py-3 text-muted">{product.category ?? "Sans catégorie"}</td><td className="px-4 py-3 font-semibold tabular-nums">{formatMad(product.price)}</td>
              <td className="px-4 py-3"><span className={product.availableStock <= 3 ? "font-bold text-warning" : "font-semibold"}>{product.availableStock}</span><span className="text-muted"> / {product.totalStock}</span></td>
              <td className="px-4 py-3"><span className={`inline-flex min-h-7 items-center border px-2 text-xs font-bold ${product.status === "ACTIVE" ? "border-success/40 text-success" : product.status === "DRAFT" ? "border-border text-muted" : "border-warning/40 text-warning"}`}>{product.status === "ACTIVE" ? "En ligne" : product.status === "DRAFT" ? "Brouillon" : "Archivé"}</span></td>
              <td className="px-4 py-3"><Link href={`/admin/produits/${product.id}`} className="inline-flex min-h-11 items-center text-xs font-extrabold text-accent-strong hover:underline">Gérer</Link></td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="border border-dashed border-border px-6 py-16 text-center"><PackagePlus aria-hidden="true" className="mx-auto size-8 text-muted" /><h2 className="mt-4 font-display text-3xl font-extrabold uppercase">Aucun produit trouvé</h2><p className="mt-2 text-sm text-muted">Crée la première fiche pour commencer le catalogue.</p><Link href="/admin/produits/nouveau" className={cn(buttonVariants({ variant: "accent" }), "mt-5")}><Plus aria-hidden="true" className="size-4" />Ajouter un produit</Link></div>}
        {totalPages > 1 ? <nav aria-label="Pages des produits" className="mt-5 flex justify-between">
          {page > 1 ? <Link href={`/admin/produits?page=${page - 1}`} className={cn(buttonVariants({ variant: "outline" }))}><ArrowLeft aria-hidden="true" className="size-4" />Précédent</Link> : <span />}
          {page < totalPages ? <Link href={`/admin/produits?page=${page + 1}`} className={cn(buttonVariants({ variant: "outline" }))}>Suivant<ArrowRight aria-hidden="true" className="size-4" /></Link> : <span />}
        </nav> : null}
      </section>
    </main>
  </>;
}
