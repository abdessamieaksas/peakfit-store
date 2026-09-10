import "server-only";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getNeonAuth } from "@/lib/auth/server";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";

export type AdminRole = "OWNER" | "MANAGER" | "FULFILMENT" | "VIEWER";

export type AdminAccess = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

function allowedAdminEmails() {
  return new Set(
    (getServerEnv().ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function getAdminAccess(): Promise<AdminAccess | null> {
  const { data } = await getNeonAuth().getSession();
  const user = data?.user;
  if (!user?.id || !user.email) return null;

  const email = user.email.toLowerCase();
  const db = getDb();
  if (allowedAdminEmails().has(email)) {
    await db.execute(sql`
      INSERT INTO public.admin_profiles (auth_user_id, display_name, role, is_active)
      VALUES (${user.id}, ${user.name || email}, 'OWNER', true)
      ON CONFLICT (auth_user_id) DO NOTHING
    `);
  }

  const result = await db.execute<{
    userId: string;
    displayName: string;
    role: AdminRole;
  }>(sql`
    SELECT
      profile.auth_user_id AS "userId",
      profile.display_name AS "displayName",
      profile.role
    FROM public.admin_profiles AS profile
    WHERE profile.auth_user_id = ${user.id}
      AND profile.is_active = true
    LIMIT 1
  `);
  const profile = result.rows[0];
  return profile ? { ...profile, email } : null;
}

export async function requireAdmin(): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/connexion?reason=forbidden");
  return access;
}

export function canManageOrders(role: AdminRole) {
  return role !== "VIEWER";
}
