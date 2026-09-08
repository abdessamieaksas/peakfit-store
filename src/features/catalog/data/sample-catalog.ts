import type {
  CatalogCategory,
  CatalogProduct,
} from "@/features/catalog/domain/types";

export const catalogCategories: CatalogCategory[] = [
  { slug: "tous", label: "Tous les produits", shortLabel: "Tous" },
  { slug: "compression", label: "Compression", shortLabel: "Compression" },
  { slug: "graphique", label: "T-shirts graphiques", shortLabel: "Graphique" },
  { slug: "running", label: "Tenues running", shortLabel: "Running" },
];

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
    image: "/images/products/compression-core-black.png",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant le t-shirt noir Compression Core Peakfit",
    colors: ["Noir", "Lavande"],
    sizes: ["S", "M", "L", "XL"],
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
    image: "/images/products/kinetic-graphic-tee.png",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant le t-shirt noir graphique Kinetic Peakfit",
    colors: ["Noir", "Blanc", "Lavande"],
    sizes: ["S", "M", "L", "XL", "XXL"],
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
    image: "/images/products/velocity-running-set.png",
    imageWidth: 1122,
    imageHeight: 1402,
    alt: "Athlète portant l'ensemble running noir Velocity Peakfit",
    colors: ["Noir", "Lavande"],
    sizes: ["S", "M", "L", "XL"],
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
