import { NextResponse } from "next/server";
import { z } from "zod";

import { adminProductSchema } from "@/features/catalog/domain/admin-product";
import { getAdminProduct, updateAdminProduct } from "@/features/catalog/server/admin-product-repository";
import { canManageCatalog, getAdminAccess } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  if (!canManageCatalog(access.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: { code: "INVALID_PRODUCT" } }, { status: 400 });
  if (!(await getAdminProduct(id))) return NextResponse.json({ error: { code: "PRODUCT_NOT_FOUND" } }, { status: 404 });

  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }
  try {
    await updateAdminProduct(id, parsed.data);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
    if (code === "INVALID_IMAGE_PATH" || code === "ENOENT" || code === "UNSUPPORTED_IMAGE") {
      return NextResponse.json({ error: { code: "IMAGE_NOT_AVAILABLE" } }, { status: 400 });
    }
    if (code.includes("products_slug_uq")) return NextResponse.json({ error: { code: "CATALOG_CONFLICT" } }, { status: 409 });
    console.error("Admin product update failed", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 });
  }
}
