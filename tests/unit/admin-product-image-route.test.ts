import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminAccess, uploadProductImage } = vi.hoisted(() => ({
  getAdminAccess: vi.fn(),
  uploadProductImage: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  getAdminAccess,
  canManageCatalog: (role: string) => role === "OWNER" || role === "MANAGER",
}));
vi.mock("@/features/catalog/server/product-image-storage", () => ({
  MAX_PRODUCT_IMAGE_BYTES: 3 * 1024 * 1024,
  uploadProductImage,
}));

import { POST } from "@/app/api/admin/product-images/route";

describe("admin product image upload authorization and setup", () => {
  beforeEach(() => {
    getAdminAccess.mockReset();
    uploadProductImage.mockReset();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("rejects anonymous upload requests", async () => {
    getAdminAccess.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/admin/product-images", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it("rejects staff without catalog permission", async () => {
    getAdminAccess.mockResolvedValue({ userId: "staff-1", role: "FULFILMENT" });
    const response = await POST(new Request("http://localhost/api/admin/product-images", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it("explains when durable image storage is not configured", async () => {
    getAdminAccess.mockResolvedValue({ userId: "manager-1", role: "MANAGER" });
    const response = await POST(new Request("http://localhost/api/admin/product-images", { method: "POST" }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: { code: "IMAGE_STORAGE_NOT_CONFIGURED" } });
    expect(uploadProductImage).not.toHaveBeenCalled();
  });
});
