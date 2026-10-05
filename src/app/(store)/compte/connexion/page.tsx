import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CustomerSignIn } from "@/components/account/customer-sign-in";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export default function CustomerSignInPage() {
  return <section className="page-shell py-12 sm:py-16"><div className="mx-auto w-full max-w-md border border-border bg-surface p-7 sm:p-9">
    <Link href="/" className="font-display text-4xl font-extrabold tracking-[-0.05em]">PEAKFIT</Link>
    <ShieldCheck aria-hidden="true" className="mt-10 size-8 text-accent-strong" />
    <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Espace personnel</p>
    <h1 className="display-title mt-3 text-6xl">Mon compte</h1>
    <p className="mt-4 text-sm leading-relaxed text-muted">Retrouve les commandes passées pendant que tu étais connecté. Le compte reste optionnel pour commander.</p>
    <CustomerSignIn />
  </div></section>;
}
