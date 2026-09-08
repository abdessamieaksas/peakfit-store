import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-[75dvh] items-center py-16">
      <section className="w-full max-w-3xl border-y border-border py-14">
        <Link
          href="/"
          className="font-display text-4xl font-extrabold tracking-[-0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          PEAKFIT
        </Link>
        <p className="mt-12 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
          Erreur 404
        </p>
        <h1 className="display-title mt-3 text-[clamp(4rem,10vw,8rem)]">
          Page introuvable
        </h1>
        <p className="mt-5 max-w-lg leading-relaxed text-muted">
          Cette page n&apos;est pas disponible. Reviens à la collection Peakfit pour continuer.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-8")}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour à l&apos;accueil
        </Link>
      </section>
    </main>
  );
}
