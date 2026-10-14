import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminAccess, getDb, execute } = vi.hoisted(() => ({
  getAdminAccess: vi.fn(),
  getDb: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({
  getAdminAccess,
  canManageTeam: (role: string) => role === "OWNER",
}));
vi.mock("@/lib/db/client", () => ({ getDb }));

import { PATCH, POST } from "@/app/api/admin/team/route";

describe("admin team route authorization", () => {
  beforeEach(() => {
    getAdminAccess.mockReset();
    getDb.mockReset();
    execute.mockReset();
    getDb.mockReturnValue({ execute });
  });

  it("does not allow a manager to create staff access", async () => {
    getAdminAccess.mockResolvedValue({ userId: "manager-1", role: "MANAGER" });
    const response = await POST(new Request("http://localhost/api/admin/team", {
      method: "POST", body: JSON.stringify({ email: "staff@example.com", displayName: "Staff", role: "FULFILMENT" }),
    }));
    expect(response.status).toBe(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not allow an owner to invite another owner through staff invites", async () => {
    getAdminAccess.mockResolvedValue({ userId: "owner-1", role: "OWNER" });
    const response = await POST(new Request("http://localhost/api/admin/team", {
      method: "POST", body: JSON.stringify({ email: "new-owner@example.com", displayName: "New owner", role: "OWNER" }),
    }));
    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("prevents owners from changing their own role or access", async () => {
    getAdminAccess.mockResolvedValue({ userId: "owner-1", role: "OWNER" });
    const response = await PATCH(new Request("http://localhost/api/admin/team", {
      method: "PATCH", body: JSON.stringify({ authUserId: "owner-1", isActive: false }),
    }));
    expect(response.status).toBe(409);
    expect(execute).not.toHaveBeenCalled();
  });
});
