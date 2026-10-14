import { describe, expect, it } from "vitest";

import { canManageCatalog, canManageOrders, canManageTeam } from "@/lib/auth/permissions";

describe("role capabilities", () => {
  it("reserves staff management for the owner", () => {
    expect(canManageTeam("OWNER")).toBe(true);
    expect(canManageTeam("MANAGER")).toBe(false);
    expect(canManageTeam("FULFILMENT")).toBe(false);
    expect(canManageTeam("VIEWER")).toBe(false);
  });

  it("allows catalogue management only to owner and manager", () => {
    expect(canManageCatalog("OWNER")).toBe(true);
    expect(canManageCatalog("MANAGER")).toBe(true);
    expect(canManageCatalog("FULFILMENT")).toBe(false);
    expect(canManageCatalog("VIEWER")).toBe(false);
  });

  it("keeps fulfilment roles out of read-only while viewers cannot mutate orders", () => {
    expect(canManageOrders("OWNER")).toBe(true);
    expect(canManageOrders("MANAGER")).toBe(true);
    expect(canManageOrders("FULFILMENT")).toBe(true);
    expect(canManageOrders("VIEWER")).toBe(false);
  });
});
