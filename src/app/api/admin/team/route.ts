import { z } from "zod";

import { canManageTeam, getAdminAccess } from "@/lib/auth/access";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const staffRole = z.enum(["MANAGER", "FULFILMENT", "VIEWER"]);
const invitationSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  displayName: z.string().trim().min(1).max(120),
  role: staffRole,
});
const memberUpdateSchema = z.object({
  authUserId: z.string().min(1),
  role: staffRole.optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.isActive !== undefined);

async function requireOwner() {
  const access = await getAdminAccess();
  return access && canManageTeam(access.role) ? access : null;
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });

  const db = getDb();
  const [members, invitations] = await Promise.all([
    db.execute<{
      authUserId: string;
      email: string | null;
      displayName: string;
      role: "OWNER" | "MANAGER" | "FULFILMENT" | "VIEWER";
      isActive: boolean;
    }>(sql`SELECT auth_user_id AS "authUserId", email, display_name AS "displayName", role, is_active AS "isActive"
      FROM public.admin_profiles ORDER BY CASE role WHEN 'OWNER' THEN 0 ELSE 1 END, display_name`),
    db.execute<{ email: string; displayName: string; role: "MANAGER" | "FULFILMENT" | "VIEWER"; createdAt: Date }>(sql`
      SELECT email, display_name AS "displayName", role, created_at AS "createdAt"
      FROM public.admin_invitations ORDER BY created_at DESC
    `),
  ]);
  return Response.json({ members: members.rows, invitations: invitations.rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });

  const { email, displayName, role } = parsed.data;
  const db = getDb();
  const existing = await db.execute(sql`SELECT 1 FROM public.admin_profiles WHERE email = ${email} LIMIT 1`);
  if (existing.rows.length) return Response.json({ error: { code: "ALREADY_MEMBER" } }, { status: 409 });
  await db.execute(sql`
    INSERT INTO public.admin_invitations (email, display_name, role, invited_by_admin_id)
    VALUES (${email}, ${displayName}, ${role}, ${owner.userId})
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, role = EXCLUDED.role,
      invited_by_admin_id = EXCLUDED.invited_by_admin_id, created_at = now()
  `);
  return Response.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const parsed = memberUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  if (parsed.data.authUserId === owner.userId) return Response.json({ error: { code: "CANNOT_CHANGE_SELF" } }, { status: 409 });

  const { authUserId, role, isActive } = parsed.data;
  const db = getDb();
  const existing = await db.execute<{ role: "OWNER" | "MANAGER" | "FULFILMENT" | "VIEWER" }>(sql`
    SELECT role FROM public.admin_profiles WHERE auth_user_id = ${authUserId} LIMIT 1
  `);
  if (!existing.rows[0]) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  if (existing.rows[0].role === "OWNER") return Response.json({ error: { code: "OWNER_PROTECTED" } }, { status: 409 });
  await db.execute(sql`
    UPDATE public.admin_profiles
    SET role = COALESCE(${role ?? null}, role), is_active = COALESCE(${isActive ?? null}, is_active)
    WHERE auth_user_id = ${authUserId}
  `);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const payload = z.object({ email: z.email().transform((value) => value.trim().toLowerCase()) })
    .safeParse(await request.json().catch(() => null));
  if (!payload.success) return Response.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  await getDb().execute(sql`DELETE FROM public.admin_invitations WHERE email = ${payload.data.email}`);
  return Response.json({ ok: true });
}
