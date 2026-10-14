import "server-only";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getNeonAuth } from "@/lib/auth/server";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import type { AdminRole } from "@/lib/auth/permissions";

export { canManageCatalog, canManageOrders, canManageTeam } from "@/lib/auth/permissions";
export type { AdminRole, StaffRole } from "@/lib/auth/permissions";

export type AdminAccess = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

export type CustomerAccess = {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
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
  if (user.emailVerified && allowedAdminEmails().has(email)) {
    await db.execute(sql`
      INSERT INTO public.admin_profiles (auth_user_id, email, display_name, role, is_active)
      VALUES (${user.id}, ${email}, ${user.name || email}, 'OWNER', true)
      ON CONFLICT (auth_user_id) DO NOTHING
    `);
  }

  if (user.emailVerified) {
    // Claim an owner-created invitation only after the identity provider has
    // verified the matching address. The client cannot choose or elevate role.
    await db.execute(sql`
      WITH claimed AS (
        DELETE FROM public.admin_invitations
        WHERE email = ${email}
        RETURNING email, display_name, role
      )
      INSERT INTO public.admin_profiles
        (auth_user_id, email, display_name, role, is_active)
      SELECT ${user.id}, claimed.email, claimed.display_name, claimed.role, true
      FROM claimed
      ON CONFLICT (auth_user_id) DO NOTHING
    `);
    await db.execute(sql`
      UPDATE public.admin_profiles
      SET email = ${email}
      WHERE auth_user_id = ${user.id} AND email IS DISTINCT FROM ${email}
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
  if (!access) redirect("/connexion?reason=forbidden");
  return access;
}

export async function getCustomerAccess(): Promise<CustomerAccess | null> {
  try {
    const { data } = await getNeonAuth().getSession();
    const user = data?.user;
    if (!user?.id) return null;

    return {
      userId: user.id,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      displayName: user.name ?? null,
    };
  } catch {
    // Accounts are optional at checkout. An unavailable auth service must not
    // prevent a shopper from placing a COD order as a guest.
    return null;
  }
}

export async function requireCustomer(): Promise<CustomerAccess> {
  const access = await getCustomerAccess();
  if (!access) redirect("/connexion");
  return access;
}
