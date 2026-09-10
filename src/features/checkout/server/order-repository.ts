import "server-only";

import { sql } from "drizzle-orm";

import {
  CodOrderError,
  codOrderResultSchema,
  type CodOrderErrorCode,
  type CodOrderResult,
  type CreateCodOrderCommand,
} from "@/features/checkout/domain/order";
import { fingerprintCodOrder } from "@/features/checkout/server/fingerprint";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";

const databaseErrorCodes = [
  "INVALID_REQUEST",
  "PRODUCT_UNAVAILABLE",
  "OUT_OF_STOCK",
  "IDEMPOTENCY_CONFLICT",
  "SHIPPING_UNAVAILABLE",
] as const satisfies readonly CodOrderErrorCode[];

function errorText(error: unknown) {
  if (!(error instanceof Error)) return String(error);

  const cause = error.cause instanceof Error ? error.cause.message : "";
  return `${error.message} ${cause}`;
}

function translateDatabaseError(error: unknown): never {
  const text = errorText(error);
  const code = databaseErrorCodes.find((candidate) => text.includes(candidate));

  if (code) {
    throw new CodOrderError(code, code, { cause: error });
  }

  throw error;
}

export async function createCodOrder(
  command: CreateCodOrderCommand,
): Promise<CodOrderResult> {
  const env = getServerEnv();

  if (env.STORE_DATA_SOURCE !== "neon") {
    throw new CodOrderError(
      "SERVICE_UNAVAILABLE",
      "Order persistence is not enabled.",
    );
  }

  try {
    const result = await getDb().execute<{ result: unknown }>(sql`
      SELECT public.peakfit_create_cod_order(
        ${JSON.stringify(command)}::jsonb,
        ${fingerprintCodOrder(command)}::char(64),
        ${env.ORDER_RESERVATION_MINUTES}::integer
      ) AS result
    `);
    const payload = result.rows[0]?.result;

    if (!payload) throw new Error("The order function returned no result.");
    return codOrderResultSchema.parse(payload);
  } catch (error) {
    translateDatabaseError(error);
  }
}
