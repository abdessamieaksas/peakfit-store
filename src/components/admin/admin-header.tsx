import Link from "next/link";

import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { canManageCatalog, canManageTeam, type AdminAccess } from "@/lib/auth/access";

export function AdminHeader({ access }: { access: AdminAccess }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="page-shell flex min-h-20 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/admin" className="font-display text-3xl font-extrabold tracking-[-0.05em]">
            PEAKFIT
          </Link>
          <nav aria-label="Navigation admin" className="flex items-center gap-1 overflow-x-auto">
            <Link href="/admin" className="min-h-11 whitespace-nowrap px-2 py-3 text-xs font-bold text-muted hover:text-foreground sm:px-3 sm:text-sm">Commandes</Link>
            {canManageCatalog(access.role) ? <Link href="/admin/produits" className="min-h-11 whitespace-nowrap px-2 py-3 text-xs font-bold text-muted hover:text-foreground sm:px-3 sm:text-sm">Produits & stock</Link> : null}
            {canManageTeam(access.role) ? <Link href="/admin/equipe" className="min-h-11 whitespace-nowrap px-2 py-3 text-xs font-bold text-muted hover:text-foreground sm:px-3 sm:text-sm">Équipe</Link> : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-right text-xs text-muted md:block">
            <strong className="block text-foreground">{access.displayName}</strong>
            {access.role}
          </p>
          <AdminSignOut />
        </div>
      </div>
    </header>
  );
}
