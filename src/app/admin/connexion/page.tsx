import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminSignIn } from "@/components/admin/admin-sign-in";

export const metadata: Metadata = {
  title: "Connexion équipe",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <main className="page-shell flex min-h-dvh items-center py-12">
      <section className="mx-auto w-full max-w-md border border-border bg-surface p-7 sm:p-9">
        <Link href="/" className="font-display text-4xl font-extrabold tracking-[-0.05em]">PEAKFIT</Link>
        <ShieldCheck aria-hidden="true" className="mt-10 size-8 text-accent-strong" />
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Accès protégé</p>
        <h1 className="display-title mt-3 text-6xl">Équipe</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Connecte-toi pour suivre et confirmer les commandes Peakfit.
        </p>
        <AdminSignIn reason={reason} />
      </section>
    </main>
  );
}
