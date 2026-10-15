import { NextResponse } from "next/server";

import { MAX_PRODUCT_IMAGE_BYTES, uploadProductImage } from "@/features/catalog/server/product-image-storage";
import { canManageCatalog, getAdminAccess } from "@/lib/auth/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  if (!canManageCatalog(access.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: { code: "IMAGE_STORAGE_NOT_CONFIGURED" } }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PRODUCT_IMAGE_BYTES + 128 * 1024) {
    return NextResponse.json({ error: { code: "FILE_TOO_LARGE" } }, { status: 413 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: { code: "INVALID_IMAGE" } }, { status: 400 });
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return NextResponse.json({ error: { code: "FILE_TOO_LARGE" } }, { status: 413 });
  }
  if (!acceptedTypes.has(file.type)) {
    return NextResponse.json({ error: { code: "UNSUPPORTED_IMAGE" } }, { status: 400 });
  }

  try {
    const uploaded = await uploadProductImage(Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json({ data: uploaded }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    if (["UNSUPPORTED_IMAGE", "INVALID_IMAGE_SIZE", "INVALID_IMAGE_DIMENSIONS"].includes(code)) {
      return NextResponse.json({ error: { code } }, { status: 400 });
    }
    console.error("Admin product image upload failed", code === "IMAGE_STORAGE_NOT_CONFIGURED" ? code : "storage-provider-error");
    return NextResponse.json({ error: { code: code === "IMAGE_STORAGE_NOT_CONFIGURED" ? code : "UPLOAD_FAILED" } }, { status: 503 });
  }
}
