import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTeamManager } from "@/components/admin/admin-team-manager";
import { canManageTeam, requireAdmin } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Équipe", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const access = await requireAdmin();
  if (!canManageTeam(access.role)) return <><AdminHeader access={access} /><main className="page-shell py-16"><h1 className="font-display text-5xl font-extrabold uppercase">Accès réservé</h1><p className="mt-3 text-muted">Seul un propriétaire peut gérer les accès de l’équipe.</p></main></>;
  return <><AdminHeader access={access} /><main className="page-shell py-10 sm:py-14"><header className="mb-9 border-b border-border pb-7"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Administration</p><h1 className="display-title mt-3 text-[clamp(4rem,10vw,7rem)]">Équipe</h1><p className="mt-3 max-w-xl text-muted">Un seul compte par personne. Le rôle détermine l’espace et les actions accessibles.</p></header><AdminTeamManager /></main></>;
}
