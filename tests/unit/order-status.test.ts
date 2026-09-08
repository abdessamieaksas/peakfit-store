import { describe, expect, it } from "vitest";

import {
  canTransitionOrder,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
} from "@/features/orders/domain/status";

describe("order lifecycle", () => {
  it("keeps the expected lifecycle states explicit", () => {
    expect(ORDER_STATUSES).toEqual([
      "NEW",
      "CONTACTED",
      "CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUSED",
      "RETURNED",
    ]);
  });

  it("allows the standard fulfilled path", () => {
    expect(canTransitionOrder("NEW", "CONTACTED")).toBe(true);
    expect(canTransitionOrder("CONTACTED", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransitionOrder("PREPARING", "SHIPPED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("rejects backward and terminal transitions", () => {
    expect(canTransitionOrder("SHIPPED", "CONFIRMED")).toBe(false);
    expect(canTransitionOrder("CANCELLED", "NEW")).toBe(false);
    expect(canTransitionOrder("REFUSED", "DELIVERED")).toBe(false);
    expect(ORDER_TRANSITIONS.RETURNED).toHaveLength(0);
  });
});
