import Link from "next/link";

import { AdminSignOut } from "@/components/admin/admin-sign-out";
import type { AdminAccess } from "@/lib/auth/access";

export function AdminHeader({ access }: { access: AdminAccess }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="page-shell flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="font-display text-3xl font-extrabold tracking-[-0.05em]">
            PEAKFIT
          </Link>
          <span className="hidden text-xs font-extrabold uppercase tracking-[0.15em] text-muted sm:inline">
            Commandes
          </span>
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
