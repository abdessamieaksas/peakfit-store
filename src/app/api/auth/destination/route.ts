import { getAdminAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminAccess();
  return Response.json(
    { destination: admin ? "/admin" : "/compte" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
