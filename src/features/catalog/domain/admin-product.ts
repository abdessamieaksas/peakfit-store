import { z } from "zod";

const localProductImage = z.string().regex(/^\/images\/products\/[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g)$/i);
const blobProductImage = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) &&
      /^\/products\/[a-f0-9-]+\.(?:webp|png|jpe?g)$/i.test(url.pathname) &&
      !url.search && !url.hash;
  } catch {
    return false;
  }
}, "Choisis une image du catalogue Peakfit.");
const productImage = z.union([localProductImage, blobProductImage]);

const commaSeparatedLabels = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `Ajoute au moins une ${label}.`)
    .transform((value) => {
      const unique = new Map<string, string>();
      for (const part of value.split(",").map((item) => item.trim()).filter(Boolean)) {
        const key = part.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-MA");
        if (!unique.has(key)) unique.set(key, part);
      }
      return [...unique.values()];
    })
    .refine((values) => values.length > 0 && values.length <= maximum, `Ajoute entre 1 et ${maximum} ${label}s.`)
    .refine((values) => values.every((value) => value.length <= 80), `${label} trop longue.`);

export const adminProductSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(180, "Le nom est trop long."),
  slug: z
    .string()
    .trim()
    .min(2, "Le lien doit contenir au moins 2 caractères.")
    .max(140, "Le lien est trop long.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilise uniquement des lettres minuscules, chiffres et tirets."),
  categoryId: z.uuid("Choisis une catégorie."),
  summary: z.string().trim().min(5, "Le résumé doit contenir au moins 5 caractères.").max(400, "Le résumé est trop long."),
  description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères.").max(4000, "La description est trop longue."),
  priceDh: z.coerce.number({ error: "Saisis un prix en DH." }).finite("Saisis un prix valide.").positive("Le prix doit être supérieur à zéro.").max(100_000, "Le prix dépasse le maximum autorisé."),
  status: z.enum(["DRAFT", "ACTIVE"]),
  featured: z.boolean(),
  image: productImage,
  images: z.array(productImage).min(1, "Ajoute au moins une image.").max(8, "Un produit peut avoir 8 images maximum.").optional(),
  imageAlt: z.string().trim().min(5, "Le texte alternatif doit contenir au moins 5 caractères.").max(240, "Le texte alternatif est trop long."),
  colors: commaSeparatedLabels("couleur", 12),
  sizes: commaSeparatedLabels("taille", 12),
  initialStock: z.coerce.number({ error: "Saisis un stock initial valide." }).int("Le stock doit être un nombre entier.").min(0, "Le stock ne peut pas être négatif.").max(100_000, "Le stock dépasse le maximum autorisé."),
  benefits: z.string().trim().max(1200, "Les points forts sont trop longs."),
}).transform((value) => ({ ...value, images: value.images ?? [value.image] }))
  .refine((value) => value.images.includes(value.image), {
    message: "Choisis l’image principale dans la galerie.",
    path: ["image"],
  })
  .refine((value) => value.colors.length * value.sizes.length <= 50, {
    message: "Réduis les combinaisons : un produit peut avoir 50 variantes au maximum.",
    path: ["sizes"],
  });

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export const inventoryAdjustmentSchema = z.object({
  delta: z.coerce.number({ error: "Saisis une quantité entière." }).int("La quantité doit être un nombre entier.").min(-100_000).max(100_000).refine((value) => value !== 0, "La quantité doit être différente de zéro."),
  reason: z.string().trim().min(3, "Précise le motif de l’ajustement.").max(240, "Le motif est trop long."),
});

export function slugifyProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-MA")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}
