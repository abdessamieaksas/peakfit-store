import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";

export async function releaseExpiredReservations(batchSize = 500) {
  const size = z.number().int().min(1).max(2_000).parse(batchSize);
  const result = await getDb().execute<{ released: number }>(sql`
    SELECT public.peakfit_release_expired_reservations(${size}::integer) AS released
  `);

  return z.coerce.number().int().nonnegative().parse(result.rows[0]?.released);
}
