import "server-only";

import { sql } from "drizzle-orm";

import {
  CodOrderError,
  parseCodOrderPersistenceResult,
  type CodOrderErrorCode,
  type CodOrderResult,
  type CreateCodOrderCommand,
} from "@/features/checkout/domain/order";
import { buildCodOrderWhatsAppUrl } from "@/features/checkout/domain/whatsapp";
import { fingerprintCodOrder } from "@/features/checkout/server/fingerprint";
import { getServerEnv, publicEnv } from "@/lib/config/env";
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
    const order = parseCodOrderPersistenceResult(payload);
    const savedOrder = await getDb().execute<{
      customerName: string;
      customerPhone: string;
      city: string;
      items: Array<{
        productName: string;
        variantTitle: string;
        quantity: number;
        unitPrice: number;
        selectedOptions: Array<{ name: string; label: string }>;
      }>;
    }>(sql`
      SELECT
        saved.customer_name AS "customerName",
        saved.customer_phone AS "customerPhone",
        saved.city,
        coalesce(
          json_agg(
            json_build_object(
              'productName', item.product_name,
              'variantTitle', item.variant_title,
              'selectedOptions', item.selected_options,
              'quantity', item.quantity,
              'unitPrice', item.unit_price
            ) ORDER BY item.created_at, item.id
          ) FILTER (WHERE item.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM public.orders AS saved
      LEFT JOIN public.order_items AS item ON item.order_id = saved.id
      WHERE saved.reference = ${order.reference}
      GROUP BY saved.id
    `);
    const canonical = savedOrder.rows[0];

    if (!canonical || canonical.items.length === 0) {
      throw new Error("The saved order details could not be loaded.");
    }

    return {
      ...order,
      whatsappUrl: buildCodOrderWhatsAppUrl(
        {
          reference: order.reference,
          customerName: canonical.customerName,
          customerPhone: canonical.customerPhone,
          city: canonical.city,
          items: canonical.items,
          total: order.total,
        },
        publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
      ),
    };
  } catch (error) {
    translateDatabaseError(error);
  }
}
