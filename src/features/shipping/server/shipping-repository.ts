import "server-only";

import { asc, eq } from "drizzle-orm";

import { sampleShippingZones } from "@/features/shipping/data/sample-shipping-zones";
import {
  quoteFromZones,
  shippingQuoteInputSchema,
} from "@/features/shipping/domain/quote";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { shippingZones } from "@/lib/db/schema";

export async function getShippingQuote(input: unknown) {
  const parsed = shippingQuoteInputSchema.parse(input);
  const env = getServerEnv();

  if (env.STORE_DATA_SOURCE === "sample") {
    return quoteFromZones(parsed.city, parsed.subtotal, sampleShippingZones);
  }

  const rows = await getDb()
    .select({
      code: shippingZones.code,
      name: shippingZones.nameFr,
      cities: shippingZones.cities,
      fee: shippingZones.fee,
      freeShippingThreshold: shippingZones.freeShippingThreshold,
      estimatedDaysMin: shippingZones.estimatedDaysMin,
      estimatedDaysMax: shippingZones.estimatedDaysMax,
    })
    .from(shippingZones)
    .where(eq(shippingZones.isActive, true))
    .orderBy(asc(shippingZones.fee));

  return quoteFromZones(
    parsed.city,
    parsed.subtotal,
    rows.map((row) => ({
      ...row,
      freeShippingThreshold: row.freeShippingThreshold ?? undefined,
    })),
  );
}
