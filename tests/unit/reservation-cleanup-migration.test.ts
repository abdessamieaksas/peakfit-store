import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("drizzle/0003_peakfit_reservation_cleanup.sql"),
  "utf8",
);

describe("reservation cleanup migration", () => {
  it("locks variants and releases only active expired reservations", () => {
    expect(migration).toContain("FOR UPDATE OF variant");
    expect(migration).toContain("reservation.status = 'ACTIVE'");
    expect(migration).toContain("reservation.expires_at <= now()");
    expect(migration).toContain("status = 'EXPIRED'");
    expect(migration).toContain("reserved_quantity = greatest(0");
  });

  it("bounds the cleanup batch", () => {
    expect(migration).toContain("batch_size > 2000");
    expect(migration).toContain("LIMIT batch_size");
  });
});
