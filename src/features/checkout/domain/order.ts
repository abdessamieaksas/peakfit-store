import { z } from "zod";

import { ORDER_STATUSES } from "@/features/orders/domain/status";

const REQUIRED_TEXT_MESSAGE = "Ce champ est obligatoire.";

const requiredText = (maxLength: number) =>
  z.string().trim().min(1, REQUIRED_TEXT_MESSAGE).max(maxLength);

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength).optional(),
  );

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .email("Indique une adresse e-mail valide.")
    .optional(),
);

const attributionTouchSchema = z
  .object({
    source: optionalText(120),
    medium: optionalText(120),
    campaign: optionalText(180),
    term: optionalText(180),
    content: optionalText(180),
  })
  .strict();

export function normalizeMoroccanPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const international = compact.startsWith("00212")
    ? `+212${compact.slice(5)}`
    : compact.startsWith("212")
      ? `+${compact}`
      : compact.startsWith("0")
        ? `+212${compact.slice(1)}`
        : compact;

  return /^\+212[5-8]\d{8}$/.test(international) ? international : null;
}

export const moroccanPhoneSchema = z
  .string()
  .trim()
  .min(1, "Indique ton numéro de téléphone.")
  .max(30)
  .transform((value) => normalizeMoroccanPhone(value) ?? "")
  .pipe(
    z
      .string()
      .regex(/^\+212[5-8]\d{8}$/, "Indique un numéro marocain valide."),
  );

export const checkoutLineInputSchema = z
  .object({
    variantId: z.uuid("Variante invalide."),
    quantity: z.number().int().min(1).max(10),
  })
  .strict();

export const createCodOrderInputSchema = z
  .object({
    idempotencyKey: z.uuid("Identifiant de commande invalide."),
    customer: z
      .object({
        fullName: requiredText(160),
        phone: moroccanPhoneSchema,
        email: optionalEmail,
      })
      .strict(),
    delivery: z
      .object({
        city: requiredText(120),
        region: optionalText(120),
        addressLine: requiredText(500),
        postalCode: optionalText(24),
        note: optionalText(500),
      })
      .strict(),
    items: z.array(checkoutLineInputSchema).min(1).max(20),
    contactConsent: z.literal(true, {
      error: "Accepte d’être contacté au sujet de cette commande.",
    }),
    attribution: z
      .object({
        firstTouch: attributionTouchSchema.optional(),
        lastTouch: attributionTouchSchema.optional(),
        landingPage: optionalText(2_048),
        referrer: optionalText(2_048),
      })
      .strict()
      .optional(),
    website: z.string().max(0).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const variants = new Set<string>();

    input.items.forEach((item, index) => {
      if (variants.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index],
          message: "Cette variante apparaît plusieurs fois dans le panier.",
        });
      }

      variants.add(item.variantId);
    });
  });

export const codOrderResultSchema = z
  .object({
    reference: z.string().min(1).max(32),
    status: z.enum(ORDER_STATUSES),
    currency: z.literal("MAD"),
    subtotal: z.number().int().nonnegative(),
    shippingFee: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    estimatedDaysMin: z.number().int().positive(),
    estimatedDaysMax: z.number().int().positive(),
    reservationExpiresAt: z.iso.datetime(),
    duplicate: z.boolean(),
  })
  .strict()
  .refine((result) => result.total === result.subtotal + result.shippingFee, {
    message: "Le total de la commande est incohérent.",
    path: ["total"],
  })
  .refine(
    (result) => result.estimatedDaysMax >= result.estimatedDaysMin,
    {
      message: "Le délai de livraison est incohérent.",
      path: ["estimatedDaysMax"],
    },
  );

export type CreateCodOrderInput = z.input<typeof createCodOrderInputSchema>;
export type CreateCodOrderCommand = z.output<typeof createCodOrderInputSchema>;
export type CodOrderResult = z.output<typeof codOrderResultSchema>;

export type CodOrderErrorCode =
  | "INVALID_REQUEST"
  | "PRODUCT_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "IDEMPOTENCY_CONFLICT"
  | "SHIPPING_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE";

export class CodOrderError extends Error {
  constructor(
    public readonly code: CodOrderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CodOrderError";
  }
}
