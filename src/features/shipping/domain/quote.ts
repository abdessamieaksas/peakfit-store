import { z } from "zod";

import type { ShippingQuote } from "@/features/shipping/domain/types";
import type { ShippingZoneDefinition } from "@/features/shipping/data/sample-shipping-zones";

export const shippingQuoteInputSchema = z.object({
  city: z.string().trim().min(2, "Saisis une ville valide.").max(120),
  subtotal: z.number().int().min(0),
});

export function normalizeCity(city: string) {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-MA")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function quoteFromZones(
  city: string,
  subtotal: number,
  zones: ShippingZoneDefinition[],
): ShippingQuote {
  const normalizedCity = normalizeCity(city);
  const zone =
    zones.find((candidate) => candidate.cities.includes(normalizedCity)) ??
    zones.find((candidate) => candidate.cities.length === 0);

  if (!zone) throw new Error("No active fallback shipping zone is configured.");

  const isFree = Boolean(
    zone.freeShippingThreshold && subtotal >= zone.freeShippingThreshold,
  );

  return {
    zoneCode: zone.code,
    zoneName: zone.name,
    city: city.trim(),
    fee: isFree ? 0 : zone.fee,
    estimatedDaysMin: zone.estimatedDaysMin,
    estimatedDaysMax: zone.estimatedDaysMax,
    isFree,
  };
}
