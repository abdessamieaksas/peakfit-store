import { NextResponse } from "next/server";

import { adminProductSchema } from "@/features/catalog/domain/admin-product";
import { createAdminProduct } from "@/features/catalog/server/admin-product-repository";
import { canManageCatalog, getAdminAccess } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  if (!canManageCatalog(access.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });

  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  try {
    const id = await createAdminProduct(parsed.data, access.userId);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
    if (code === "INVALID_IMAGE_PATH" || code === "ENOENT" || code === "UNSUPPORTED_IMAGE") {
      return NextResponse.json({ error: { code: "IMAGE_NOT_AVAILABLE" } }, { status: 400 });
    }
    if (code.includes("products_slug_uq") || code.includes("product_variants_sku_uq")) {
      return NextResponse.json({ error: { code: "CATALOG_CONFLICT" } }, { status: 409 });
    }
    console.error("Admin product creation failed", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 });
  }
}
