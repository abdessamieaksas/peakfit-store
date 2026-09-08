import { CategoryRail } from "@/components/store/category-rail";
import { FeaturedProducts } from "@/components/store/featured-products";
import { Hero } from "@/components/store/hero";
import { TrustStrip } from "@/components/store/trust-strip";
import {
  listCatalogCategories,
  listCatalogProducts,
} from "@/features/catalog/server/catalog-repository";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    listCatalogCategories(),
    listCatalogProducts(),
  ]);

  return (
    <>
      <Hero />
      <CategoryRail categories={categories} />
      <FeaturedProducts products={products} />
      <TrustStrip />
    </>
  );
}
