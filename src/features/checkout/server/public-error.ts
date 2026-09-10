import {
  CodOrderError,
  type CodOrderErrorCode,
} from "@/features/checkout/domain/order";

const publicErrors: Record<
  CodOrderErrorCode,
  { status: number; message: string }
> = {
  INVALID_REQUEST: {
    status: 400,
    message: "Vérifie les informations de la commande.",
  },
  PRODUCT_UNAVAILABLE: {
    status: 409,
    message:
      "Un article de ton panier n’est plus disponible. Retourne au panier pour le modifier.",
  },
  OUT_OF_STOCK: {
    status: 409,
    message:
      "Le stock vient de changer. Modifie la quantité puis réessaie.",
  },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    message:
      "La commande a changé depuis le dernier essai. Actualise la page puis réessaie.",
  },
  SHIPPING_UNAVAILABLE: {
    status: 409,
    message:
      "La livraison n’est pas disponible pour cette adresse pour le moment.",
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message:
      "La commande ne peut pas être envoyée pour le moment. Réessaie dans quelques instants.",
  },
};

export function toPublicCodOrderError(error: unknown) {
  if (error instanceof CodOrderError) {
    return { code: error.code, ...publicErrors[error.code] };
  }

  return {
    code: "SERVICE_UNAVAILABLE" as const,
    ...publicErrors.SERVICE_UNAVAILABLE,
  };
}
