import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Accès équipe",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="page-shell flex min-h-[75dvh] items-center py-16">
      <section className="w-full max-w-3xl border-y border-border py-14">
        <Link
          href="/"
          className="font-display text-4xl font-extrabold tracking-[-0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          PEAKFIT
        </Link>
        <ShieldCheck aria-hidden="true" className="mt-12 size-8 text-accent-strong" />
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
          Accès équipe
        </p>
        <h1 className="display-title mt-3 text-[clamp(4rem,10vw,8rem)]">
          Espace réservé
        </h1>
        <p className="mt-5 max-w-lg leading-relaxed text-muted">
          Cette zone est réservée à l&apos;équipe Peakfit.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-8")}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour à la boutique
        </Link>
      </section>
    </main>
  );
}
