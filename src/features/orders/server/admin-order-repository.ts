import "server-only";

import { sql } from "drizzle-orm";

import type { OrderStatus } from "@/features/orders/domain/status";
import { getDb } from "@/lib/db/client";

export type AdminOrderSummary = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  city: string;
  status: OrderStatus;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
};

export type AdminOrderDetail = AdminOrderSummary & {
  customerEmail: string | null;
  addressLine: string;
  region: string | null;
  postalCode: string | null;
  customerNote: string | null;
  subtotal: number;
  shippingFee: number;
  shippingZoneName: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  version: number;
  items: Array<{
    id: string;
    productName: string;
    variantTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  history: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    reason: string | null;
    createdAt: Date;
  }>;
};

export async function listAdminOrders(status?: OrderStatus) {
  const result = await getDb().execute<AdminOrderSummary>(sql`
    SELECT
      "order".id,
      "order".reference,
      "order".customer_name AS "customerName",
      "order".customer_phone AS "customerPhone",
      "order".city,
      "order".status,
      "order".total,
      "order".currency,
      coalesce(sum(item.quantity), 0)::integer AS "itemCount",
      "order".created_at AS "createdAt"
    FROM public.orders AS "order"
    LEFT JOIN public.order_items AS item ON item.order_id = "order".id
    WHERE (${status ?? null}::order_status IS NULL OR "order".status = ${status ?? null}::order_status)
    GROUP BY "order".id
    ORDER BY
      CASE "order".status
        WHEN 'NEW' THEN 0
        WHEN 'CONTACTED' THEN 1
        WHEN 'CONFIRMED' THEN 2
        WHEN 'PREPARING' THEN 3
        WHEN 'SHIPPED' THEN 4
        ELSE 5
      END,
      "order".created_at DESC
    LIMIT 100
  `);
  return result.rows;
}

export async function countOrdersByStatus() {
  const result = await getDb().execute<{ status: OrderStatus; count: number }>(sql`
    SELECT status, count(*)::integer AS count
    FROM public.orders
    GROUP BY status
  `);
  return new Map(result.rows.map((row) => [row.status, row.count]));
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  const db = getDb();
  const orderResult = await db.execute<Omit<AdminOrderDetail, "items" | "history">>(sql`
    SELECT
      "order".id,
      "order".reference,
      "order".customer_name AS "customerName",
      "order".customer_phone AS "customerPhone",
      "order".customer_email AS "customerEmail",
      "order".city,
      "order".region,
      "order".address_line AS "addressLine",
      "order".postal_code AS "postalCode",
      "order".customer_note AS "customerNote",
      "order".status,
      "order".subtotal,
      "order".shipping_fee AS "shippingFee",
      "order".total,
      "order".currency,
      "order".shipping_zone_name AS "shippingZoneName",
      "order".estimated_days_min AS "estimatedDaysMin",
      "order".estimated_days_max AS "estimatedDaysMax",
      "order".version,
      coalesce(sum(item.quantity), 0)::integer AS "itemCount",
      "order".created_at AS "createdAt"
    FROM public.orders AS "order"
    LEFT JOIN public.order_items AS item ON item.order_id = "order".id
    WHERE "order".id = ${orderId}::uuid
    GROUP BY "order".id
    LIMIT 1
  `);
  const order = orderResult.rows[0];
  if (!order) return null;

  const [itemsResult, historyResult] = await Promise.all([
    db.execute<AdminOrderDetail["items"][number]>(sql`
      SELECT
        id,
        product_name AS "productName",
        variant_title AS "variantTitle",
        sku,
        unit_price AS "unitPrice",
        quantity,
        line_total AS "lineTotal"
      FROM public.order_items
      WHERE order_id = ${orderId}::uuid
      ORDER BY created_at, id
    `),
    db.execute<AdminOrderDetail["history"][number]>(sql`
      SELECT
        id,
        from_status AS "fromStatus",
        to_status AS "toStatus",
        reason,
        created_at AS "createdAt"
      FROM public.order_status_history
      WHERE order_id = ${orderId}::uuid
      ORDER BY created_at DESC, id DESC
    `),
  ]);

  return { ...order, items: itemsResult.rows, history: historyResult.rows };
}

export type TransitionOrderResult = { status: OrderStatus; version: number };

export async function transitionAdminOrder(input: {
  orderId: string;
  expectedVersion: number;
  nextStatus: OrderStatus;
  actorAdminId: string;
  reason?: string;
}) {
  const result = await getDb().execute<{ result: TransitionOrderResult }>(sql`
    SELECT public.peakfit_transition_order(
      ${input.orderId}::uuid,
      ${input.expectedVersion}::integer,
      ${input.nextStatus}::order_status,
      ${input.actorAdminId}::text,
      ${input.reason ?? null}::text
    ) AS result
  `);
  const transition = result.rows[0]?.result;
  if (!transition) throw new Error("The order transition returned no result.");
  return transition;
}
