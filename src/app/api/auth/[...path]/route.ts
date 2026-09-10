import { getNeonAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: AuthContext) {
  return getNeonAuth().handler().GET(request, context);
}

export function POST(request: Request, context: AuthContext) {
  return getNeonAuth().handler().POST(request, context);
}

export function PUT(request: Request, context: AuthContext) {
  return getNeonAuth().handler().PUT(request, context);
}

export function DELETE(request: Request, context: AuthContext) {
  return getNeonAuth().handler().DELETE(request, context);
}

export function PATCH(request: Request, context: AuthContext) {
  return getNeonAuth().handler().PATCH(request, context);
}
