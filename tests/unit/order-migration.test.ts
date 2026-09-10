import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve("drizzle/0002_peakfit_cod_order.sql");
const migration = readFileSync(migrationPath, "utf8");

describe("atomic COD order migration", () => {
  it("serializes idempotent submissions and compares their intent", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("request_fingerprint");
    expect(migration).toContain("IDEMPOTENCY_CONFLICT");
  });

  it("locks inventory and calculates money from database values", () => {
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain(
      "coalesce(variant.price_override, product.base_price)",
    );
    expect(migration).toMatch(
      /"variant_record"\.stock_quantity - "variant_record"\.reserved_quantity/,
    );
    expect(migration).toContain("public.shipping_zones");
  });

  it("creates snapshots, reservations, history, and notification intent together", () => {
    expect(migration).toContain("INSERT INTO public.order_items");
    expect(migration).toContain("INSERT INTO public.inventory_reservations");
    expect(migration).toContain("INSERT INTO public.order_status_history");
    expect(migration).toContain("INSERT INTO public.notification_outbox");
    expect(migration).toContain("consentCapturedAt");
  });
});
