import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { buttonVariants } from "@/components/ui/button";
import { listAdminProductCategories, listLocalProductImages } from "@/features/catalog/server/admin-product-repository";
import { canManageCatalog, requireAdmin } from "@/lib/auth/access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ajouter un produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
  const access = await requireAdmin();
  if (!canManageCatalog(access.role)) return <><AdminHeader access={access} /><main className="page-shell py-16"><h1 className="font-display text-5xl font-extrabold uppercase">Accès réservé</h1><p className="mt-3 text-muted">Ton rôle ne permet pas de gérer le catalogue.</p></main></>;
  const [categories, images] = await Promise.all([listAdminProductCategories(), listLocalProductImages()]);
  return <>
    <AdminHeader access={access} />
    <main className="page-shell py-10 sm:py-14">
      <Link href="/admin/produits" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}><ArrowLeft aria-hidden="true" className="size-4" />Retour aux produits</Link>
      <div className="mt-5 border-b border-border pb-7"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Nouveau produit</p><h1 className="display-title mt-2 text-[clamp(3.6rem,9vw,6.5rem)]">Ajouter au catalogue</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">La fiche et toutes ses variantes sont créées ensemble. Le stock et le motif initial sont conservés dans l’historique.</p></div>
      {categories.length ? <AdminProductForm categories={categories} images={images} /> : <section className="mt-8 border border-warning/40 bg-surface p-5"><h2 className="font-bold">Aucune catégorie active</h2><p className="mt-1 text-sm text-muted">Active au moins une catégorie avant d’ajouter un produit.</p></section>}
    </main>
  </>;
}
