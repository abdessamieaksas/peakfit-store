import "server-only";

import { sql } from "drizzle-orm";

import {
  LOW_STOCK_DASHBOARD_LIMIT,
  LOW_STOCK_THRESHOLD,
} from "@/features/inventory/domain/stock-level";
import { getDb } from "@/lib/db/client";

export type LowStockVariant = {
  productId: string;
  productName: string;
  variantTitle: string;
  sku: string;
  availableQuantity: number;
};

export type LowStockOverview = {
  threshold: number;
  totalVariants: number;
  variants: LowStockVariant[];
};

type LowStockRow = LowStockVariant & { totalVariants: number };

export async function getLowStockOverview(): Promise<LowStockOverview> {
  const result = await getDb().execute<LowStockRow>(sql`
    SELECT
      count(*) OVER ()::integer AS "totalVariants",
      product.id AS "productId",
      product.name_fr AS "productName",
      variant.title AS "variantTitle",
      variant.sku,
      (variant.stock_quantity - variant.reserved_quantity)::integer AS "availableQuantity"
    FROM public.product_variants AS variant
    INNER JOIN public.products AS product ON product.id = variant.product_id
    WHERE product.status = 'ACTIVE'
      AND variant.is_active = true
      AND variant.stock_quantity - variant.reserved_quantity <= ${LOW_STOCK_THRESHOLD}
    ORDER BY "availableQuantity" ASC, product.name_fr ASC, variant.title ASC
    LIMIT ${LOW_STOCK_DASHBOARD_LIMIT}
  `);

  return {
    threshold: LOW_STOCK_THRESHOLD,
    totalVariants: result.rows[0]?.totalVariants ?? 0,
    variants: result.rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      variantTitle: row.variantTitle,
      sku: row.sku,
      availableQuantity: row.availableQuantity,
    })),
  };
}
