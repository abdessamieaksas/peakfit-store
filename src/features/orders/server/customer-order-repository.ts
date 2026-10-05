import "server-only";

import { sql } from "drizzle-orm";

import type { OrderStatus } from "@/features/orders/domain/status";
import { getDb } from "@/lib/db/client";

export type CustomerOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: Date;
  items: Array<{ productName: string; variantTitle: string; quantity: number }>;
};

export async function listCustomerOrders(verifiedEmail: string): Promise<CustomerOrder[]> {
  const result = await getDb().execute<CustomerOrder>(sql`
    SELECT
      "order".id,
      "order".reference,
      "order".status,
      "order".total,
      "order".currency,
      "order".created_at AS "createdAt",
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'productName', item.product_name,
            'variantTitle', item.variant_title,
            'quantity', item.quantity
          ) ORDER BY item.created_at, item.id
        ) FILTER (WHERE item.id IS NOT NULL),
        '[]'::jsonb
      ) AS items
    FROM public.orders AS "order"
    LEFT JOIN public.order_items AS item ON item.order_id = "order".id
    WHERE lower("order".customer_email) = lower(${verifiedEmail})
    GROUP BY "order".id
    ORDER BY "order".created_at DESC
  `);
  return result.rows;
}
