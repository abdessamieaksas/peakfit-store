export type CatalogCategory = {
  slug: string;
  label: string;
  shortLabel: string;
};

export type CatalogOptionValue = {
  code: string;
  label: string;
  swatch?: string;
};

export type CatalogOption = {
  code: string;
  name: string;
  values: CatalogOptionValue[];
};

export type CatalogVariant = {
  id: string;
  sku: string;
  title: string;
  price: number;
  availableQuantity: number;
  optionValues: Record<string, string>;
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
  options: CatalogOption[];
  variants: CatalogVariant[];
  benefits: string[];
};
