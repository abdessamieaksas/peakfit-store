import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DemoDashboard } from "@/components/demo/demo-dashboard";
import { DemoLogout } from "@/components/demo/demo-logout";
import { hasDemoSession } from "@/lib/demo/session";

export const metadata: Metadata = {
  title: "Tableau de bord — Démonstration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DemoAdminPage() {
  if (!(await hasDemoSession())) redirect("/demo/connexion");
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="page-shell flex min-h-16 items-center justify-between gap-4">
          <a href="/demo/admin" className="font-display text-2xl font-extrabold tracking-[-0.04em]">PEAKFIT <span className="font-sans text-xs font-extrabold uppercase tracking-[0.12em] text-accent-strong">démo</span></a>
          <DemoLogout />
        </div>
      </header>
      <DemoDashboard />
    </>
  );
}
