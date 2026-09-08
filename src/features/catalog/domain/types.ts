export type CatalogCategory = {
  slug: string;
  label: string;
  shortLabel: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  badge?: "Nouveau" | "Best-seller";
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  colors: string[];
  sizes: string[];
  benefits: string[];
};
