import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";

export type AdminDashboardMetrics = {
  newOrdersToday: number;
  ordersAwaitingConfirmation: number;
  ordersThisMonth: number;
  confirmedCodValueThisMonth: number;
};

type AdminDashboardMetricRow = Omit<
  AdminDashboardMetrics,
  "confirmedCodValueThisMonth"
> & {
  confirmedCodValueThisMonth: string | number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const result = await getDb().execute<AdminDashboardMetricRow>(sql`
    WITH local_periods AS (
      SELECT
        date_trunc('day', now() AT TIME ZONE 'Africa/Casablanca')
          AT TIME ZONE 'Africa/Casablanca' AS day_start,
        (date_trunc('day', now() AT TIME ZONE 'Africa/Casablanca') + interval '1 day')
          AT TIME ZONE 'Africa/Casablanca' AS next_day_start,
        date_trunc('month', now() AT TIME ZONE 'Africa/Casablanca')
          AT TIME ZONE 'Africa/Casablanca' AS month_start,
        (date_trunc('month', now() AT TIME ZONE 'Africa/Casablanca') + interval '1 month')
          AT TIME ZONE 'Africa/Casablanca' AS next_month_start
    )
    SELECT
      count(*) FILTER (
        WHERE created_at >= local_periods.day_start
          AND created_at < local_periods.next_day_start
      )::integer AS "newOrdersToday",
      count(*) FILTER (
        WHERE status IN ('NEW', 'CONTACTED')
      )::integer AS "ordersAwaitingConfirmation",
      count(*) FILTER (
        WHERE created_at >= local_periods.month_start
          AND created_at < local_periods.next_month_start
      )::integer AS "ordersThisMonth",
      coalesce(
        sum(total) FILTER (
          WHERE created_at >= local_periods.month_start
            AND created_at < local_periods.next_month_start
          AND status IN ('CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED')
        ),
        0
      )::text AS "confirmedCodValueThisMonth"
    FROM public.orders
    CROSS JOIN local_periods
  `);

  const row = result.rows[0];
  return {
    newOrdersToday: row?.newOrdersToday ?? 0,
    ordersAwaitingConfirmation: row?.ordersAwaitingConfirmation ?? 0,
    ordersThisMonth: row?.ordersThisMonth ?? 0,
    confirmedCodValueThisMonth: Number(row?.confirmedCodValueThisMonth ?? 0),
  };
}
