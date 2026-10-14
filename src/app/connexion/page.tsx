import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomerSignIn } from "@/components/account/customer-sign-in";
import { getAdminAccess, getCustomerAccess } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Connexion Peakfit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const [admin, customer] = await Promise.all([getAdminAccess(), getCustomerAccess()]);
  if (admin) redirect("/admin");
  if (customer) redirect("/compte");
  const { reason } = await searchParams;

  return <section className="page-shell py-12 sm:py-16"><div className="mx-auto w-full max-w-md border border-border bg-surface p-7 sm:p-9">
    <Link href="/" className="font-display text-4xl font-extrabold tracking-[-0.05em]">PEAKFIT</Link>
    <ShieldCheck aria-hidden="true" className="mt-10 size-8 text-accent-strong" />
    <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Un seul accès, selon ton rôle</p>
    <h1 className="display-title mt-3 text-6xl">Connexion</h1>
    <p className="mt-4 text-sm leading-relaxed text-muted">Connecte-toi ou crée un compte. Les clients accèdent à leurs commandes ; les membres Peakfit autorisés sont dirigés vers leur espace de travail.</p>
    {reason === "forbidden" ? <p className="mt-4 border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">Ce compte n’a pas de rôle équipe actif. Tu peux toujours utiliser ton compte client, ou demander à un propriétaire Peakfit un accès équipe.</p> : null}
    <CustomerSignIn />
  </div></section>;
}
