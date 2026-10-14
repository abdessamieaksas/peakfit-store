import { type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ execute }),
}));

import { getLowStockOverview } from "@/features/inventory/server/admin-inventory-repository";

describe("low stock dashboard overview", () => {
  beforeEach(() => execute.mockReset());

  it("shows available stock after reservations and reports the total count", async () => {
    execute.mockResolvedValueOnce({
      rows: [
        {
          productId: "5d3e3f9c-d091-4a0e-b063-53073dd81ed5",
          totalVariants: 1,
          productName: "Compression Core",
          variantTitle: "Noir / M",
          sku: "CORE-NOIR-M",
          availableQuantity: 2,
        },
      ],
    });

    await expect(getLowStockOverview()).resolves.toEqual({
      threshold: 3,
      totalVariants: 1,
      variants: [
        {
          productId: "5d3e3f9c-d091-4a0e-b063-53073dd81ed5",
          productName: "Compression Core",
          variantTitle: "Noir / M",
          sku: "CORE-NOIR-M",
          availableQuantity: 2,
        },
      ],
    });

    const [statement] = execute.mock.calls[0] as [SQL];
    const query = new PgDialect().sqlToQuery(statement);
    expect(query.sql).toContain("product.status = 'ACTIVE'");
    expect(query.sql).toContain("variant.is_active = true");
    expect(query.sql).toContain("variant.stock_quantity - variant.reserved_quantity");
    expect(query.params).toEqual([3, 8]);
  });

  it("returns a clear empty state when every active variant is above threshold", async () => {
    execute.mockResolvedValueOnce({ rows: [] });

    await expect(getLowStockOverview()).resolves.toEqual({
      threshold: 3,
      totalVariants: 0,
      variants: [],
    });
  });
});
