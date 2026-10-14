import { NextResponse } from "next/server";
import { z } from "zod";

import { inventoryAdjustmentSchema } from "@/features/catalog/domain/admin-product";
import { adjustAdminVariantStock } from "@/features/catalog/server/admin-product-repository";
import { canManageCatalog, getAdminAccess } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  if (!canManageCatalog(access.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const { id, variantId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(variantId).success) {
    return NextResponse.json({ error: { code: "INVALID_VARIANT" } }, { status: 400 });
  }
  const parsed = inventoryAdjustmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  try {
    const data = await adjustAdminVariantStock({ productId: id, variantId, actorAdminId: access.userId, ...parsed.data });
    return NextResponse.json({ data });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
    if (code === "STOCK_CONFLICT") return NextResponse.json({ error: { code } }, { status: 409 });
    console.error("Admin inventory adjustment failed", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 });
  }
}
