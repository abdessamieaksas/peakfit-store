import { type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ execute }),
}));

import { getAdminDashboardMetrics } from "@/features/orders/server/admin-dashboard-repository";

describe("admin dashboard metrics", () => {
  beforeEach(() => execute.mockReset());

  it("normalizes database counts and preserves COD value in centimes", async () => {
    execute.mockResolvedValueOnce({
      rows: [
        {
          newOrdersToday: 2,
          ordersAwaitingConfirmation: 4,
          ordersThisMonth: 13,
          confirmedCodValueThisMonth: "128900",
        },
      ],
    });

    await expect(getAdminDashboardMetrics()).resolves.toEqual({
      newOrdersToday: 2,
      ordersAwaitingConfirmation: 4,
      ordersThisMonth: 13,
      confirmedCodValueThisMonth: 128900,
    });
  });

  it("uses Morocco-local date boundaries and excludes unconfirmed or failed orders from value", async () => {
    execute.mockResolvedValueOnce({ rows: [] });

    await getAdminDashboardMetrics();

    const [statement] = execute.mock.calls[0] as [SQL];
    const query = new PgDialect().sqlToQuery(statement);
    expect(query.sql).toContain("Africa/Casablanca");
    expect(query.sql).toContain("created_at < local_periods.next_day_start");
    expect(query.sql).toContain("created_at < local_periods.next_month_start");
    expect(query.sql).toContain("status IN ('NEW', 'CONTACTED')");
    expect(query.sql).toContain("status IN ('CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED')");
    expect(query.sql).toContain("date_trunc('month'");
  });
});
