import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminAccess } = vi.hoisted(() => ({ getAdminAccess: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ getAdminAccess }));

import { GET } from "@/app/api/auth/destination/route";

describe("GET /api/auth/destination", () => {
  beforeEach(() => getAdminAccess.mockReset());

  it("routes active staff identities to the admin workspace", async () => {
    getAdminAccess.mockResolvedValue({ userId: "staff-1", role: "OWNER" });
    const response = await GET();
    expect(await response.json()).toEqual({ destination: "/admin" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("keeps ordinary accounts in their customer account", async () => {
    getAdminAccess.mockResolvedValue(null);
    const response = await GET();
    expect(await response.json()).toEqual({ destination: "/compte" });
  });
});
