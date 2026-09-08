import type { Metadata } from "next";

import { CatalogSearch } from "@/components/store/catalog-search";
import { CategoryRail } from "@/components/store/category-rail";
import { ProductCard } from "@/components/store/product-card";
import {
  listCatalogCategories,
  listCatalogProducts,
} from "@/features/catalog/server/catalog-repository";

export const metadata: Metadata = {
  title: "Shop",
  description: "Tous les vêtements de performance Peakfit.",
};

type ShopPageProps = {
  searchParams: Promise<{
    categorie?: string;
    recherche?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { categorie = "tous", recherche = "" } = await searchParams;
  const [catalogCategories, catalogProducts] = await Promise.all([
    listCatalogCategories(),
    listCatalogProducts(),
  ]);
  const normalizedQuery = recherche.trim().toLocaleLowerCase("fr-MA");
  const products = catalogProducts.filter((product) => {
    const categoryMatches =
      categorie === "tous" || product.category === categorie;
    const searchMatches =
      !normalizedQuery ||
      `${product.name} ${product.summary} ${product.category}`
        .toLocaleLowerCase("fr-MA")
        .includes(normalizedQuery);

    return categoryMatches && searchMatches;
  });
  const activeCategory =
    catalogCategories.find((category) => category.slug === categorie) ??
    catalogCategories[0];

  return (
    <>
      <section className="page-shell pb-10 pt-14 sm:pb-14 sm:pt-20">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
          Catalogue
        </p>
        <h1 className="display-title mt-3 text-[clamp(4rem,9vw,8rem)]">
          Trouve ton rythme
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Une base claire pour la salle, la course et le quotidien. Choisis ta coupe, ta taille et avance.
        </p>
        <div className="mt-8">
          <CatalogSearch initialValue={recherche} />
        </div>
      </section>
      <CategoryRail active={activeCategory.slug} categories={catalogCategories} />
      <section className="page-shell py-14 sm:py-20" aria-labelledby="catalog-title">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 id="catalog-title" className="font-display text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">
              {activeCategory.label}
            </h2>
            <p className="mt-2 text-sm text-muted" role="status" aria-live="polite">
              {products.length} produit{products.length === 1 ? "" : "s"}
              {recherche ? ` pour « ${recherche} »` : ""}
            </p>
          </div>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-y border-border py-16 text-center">
            <h3 className="font-display text-4xl font-extrabold">Aucun résultat</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Essaie un autre mot ou réinitialise la catégorie pour revoir toute la collection.
            </p>
            <a
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center font-bold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Effacer les filtres
            </a>
          </div>
        )}
      </section>
    </>
  );
}
