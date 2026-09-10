import type {
  CatalogCategory,
  CatalogOption,
  CatalogProduct,
  CatalogVariant,
} from "@/features/catalog/domain/types";

const colorCodes: Record<string, { code: string; swatch: string }> = {
  Noir: { code: "blk", swatch: "#09090b" },
  Blanc: { code: "wht", swatch: "#f7f6f8" },
  Lavande: { code: "lav", swatch: "#b8a2ff" },
};

function optionCode(value: string) {
  return value.toLocaleLowerCase("fr-MA").replace(/[^a-z0-9]+/g, "-");
}

function createOptions(sizes: string[], colors: string[]): CatalogOption[] {
  return [
    {
      code: "size",
      name: "Taille",
      values: sizes.map((label) => ({ code: optionCode(label), label })),
    },
    {
      code: "color",
      name: "Couleur",
      values: colors.map((label) => ({
        code: colorCodes[label]?.code ?? optionCode(label),
        label,
        swatch: colorCodes[label]?.swatch,
      })),
    },
  ];
}

function createVariants(
  productIndex: number,
  skuRoot: string,
  price: number,
  sizes: string[],
  colors: string[],
): CatalogVariant[] {
  let variantIndex = 0;

  return colors.flatMap((color) =>
    sizes.map((size) => {
      variantIndex += 1;
      const colorCode = colorCodes[color]?.code ?? optionCode(color);
      const sizeCode = optionCode(size);

      return {
        id: `50000000-0000-4000-800${productIndex}-${String(variantIndex).padStart(12, "0")}`,
        sku: `PF-${skuRoot}-${colorCode.toUpperCase()}-${sizeCode.toUpperCase()}`,
        title: `${color} / ${size}`,
        price,
        availableQuantity: 20,
        optionValues: { size: sizeCode, color: colorCode },
      };
    }),
  );
}

export const catalogCategories: CatalogCategory[] = [
  { slug: "tous", label: "Tous les produits", shortLabel: "Tous" },
  { slug: "compression", label: "Compression", shortLabel: "Compression" },
  { slug: "graphique", label: "T-shirts graphiques", shortLabel: "Graphique" },
  { slug: "running", label: "Tenues running", shortLabel: "Running" },
];

const coreSizes = ["S", "M", "L", "XL"];
const coreColors = ["Noir", "Lavande"];
const kineticSizes = ["S", "M", "L", "XL", "XXL"];
const kineticColors = ["Noir", "Blanc", "Lavande"];
const velocitySizes = ["S", "M", "L", "XL"];
const velocityColors = ["Noir", "Lavande"];

export const sampleProducts: CatalogProduct[] = [
  {
    id: "compression-core-black",
    slug: "compression-core-noir",
    name: "Compression Core",
    summary: "Maintien ciblé, respirabilité nette et liberté totale.",
    description:
      "Un haut de compression technique conçu pour les séances lourdes et les efforts intenses. Sa construction près du corps soutient sans limiter le mouvement.",
    category: "compression",
    price: 25900,
    badge: "Nouveau",
    image: "/images/products/compression-core-black.webp",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant le t-shirt noir Compression Core Peakfit",
    colors: coreColors,
    sizes: coreSizes,
    options: createOptions(coreSizes, coreColors),
    variants: createVariants(1, "CORE", 25900, coreSizes, coreColors),
    benefits: [
      "Tissu extensible quatre directions",
      "Zones respirantes à séchage rapide",
      "Coutures plates anti-frottement",
    ],
  },
  {
    id: "kinetic-graphic-tee",
    slug: "t-shirt-kinetic-noir",
    name: "T-shirt Kinetic",
    summary: "Une coupe training nette avec une énergie graphique originale.",
    description:
      "Le Kinetic apporte une silhouette athlétique plus décontractée et un graphisme abstrait inspiré du mouvement. Il passe de la salle à la ville sans perdre son identité.",
    category: "graphique",
    price: 22900,
    badge: "Best-seller",
    image: "/images/products/kinetic-graphic-tee.webp",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant le t-shirt noir graphique Kinetic Peakfit",
    colors: kineticColors,
    sizes: kineticSizes,
    options: createOptions(kineticSizes, kineticColors),
    variants: createVariants(2, "KIN", 22900, kineticSizes, kineticColors),
    benefits: [
      "Jersey doux et respirant",
      "Coupe athlétique facile à porter",
      "Graphisme exclusif résistant au lavage",
    ],
  },
  {
    id: "velocity-running-set",
    slug: "ensemble-running-velocity",
    name: "Ensemble Velocity",
    summary: "Une tenue complète, profilée pour courir plus librement.",
    description:
      "Un ensemble running ajusté composé d'un haut manches longues et d'un bas technique. Les lignes réfléchissantes améliorent la visibilité sans surcharger la silhouette.",
    category: "running",
    price: 49900,
    compareAtPrice: 55900,
    badge: "Nouveau",
    image: "/images/products/velocity-running-set.webp",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant l'ensemble running noir Velocity Peakfit",
    colors: velocityColors,
    sizes: velocitySizes,
    options: createOptions(velocitySizes, velocityColors),
    variants: createVariants(
      3,
      "VEL",
      49900,
      velocitySizes,
      velocityColors,
    ),
    benefits: [
      "Ensemble deux pièces coordonné",
      "Matière légère qui évacue l'humidité",
      "Détails réfléchissants pour faible luminosité",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return sampleProducts.find((product) => product.slug === slug);
}
