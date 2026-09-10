import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("drizzle/0004_peakfit_order_transitions.sql"),
  "utf8",
);

describe("order transition migration", () => {
  it("uses optimistic locking and rejects invalid transitions", () => {
    expect(migration).toContain("VERSION_CONFLICT");
    expect(migration).toContain("INVALID_TRANSITION");
    expect(migration).toContain("FOR UPDATE");
  });

  it("commits stock only when a COD order is confirmed", () => {
    expect(migration).toContain("next_status_value = 'CONFIRMED'");
    expect(migration).toContain("stock_quantity = variant.stock_quantity - reserved.quantity");
    expect(migration).toContain("status = 'COMMITTED'");
    expect(migration.indexOf("IF EXISTS (")).toBeLessThan(
      migration.indexOf("stock_quantity = variant.stock_quantity - reserved.quantity"),
    );
  });

  it("releases reserved or committed stock when an order is cancelled", () => {
    expect(migration).toContain("status = 'RELEASED'");
    expect(migration).toContain("stock_quantity = variant.stock_quantity + committed.quantity");
    expect(migration).toContain("order_returned_to_stock");
  });

  it("queues a status notification and writes immutable history", () => {
    expect(migration).toContain("ORDER_STATUS_CHANGED");
    expect(migration).toContain("INSERT INTO public.order_status_history");
  });
});
