import type { Metadata } from "next";
import Link from "next/link";

import { DemoSignIn } from "@/components/demo/demo-sign-in";
import { demoCredentialsConfigured, hasDemoSession } from "@/lib/demo/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Accès démo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DemoSignInPage() {
  if (await hasDemoSession()) redirect("/demo/admin");

  return (
    <main className="page-shell grid min-h-[80dvh] place-items-center py-12">
      <section className="w-full max-w-md border border-border bg-surface p-7 sm:p-9">
        <Link href="/" className="font-display text-4xl font-extrabold tracking-[-0.05em]">PEAKFIT</Link>
        <p className="mt-8 inline-flex border border-accent-strong px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Démonstration — données fictives</p>
        <h1 className="display-title mt-5 text-6xl">Accès démo</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">Explore un exemple de tableau de bord de commandes. Rien ici ne lit ou ne modifie les commandes réelles de Peakfit.</p>
        {demoCredentialsConfigured() ? (
          <DemoSignIn />
        ) : (
          <p role="status" className="mt-7 border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed">
            L’accès démo est en préparation. Les identifiants de démonstration n’ont pas encore été configurés.
          </p>
        )}
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">Retour à la boutique</Link>
      </section>
    </main>
  );
}
