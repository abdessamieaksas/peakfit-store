"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type AuthCallbackProps = {
  destination: "/admin" | "/compte";
  retryHref: "/admin/connexion" | "/compte/connexion";
};

export function AuthCallback({ destination, retryHref }: AuthCallbackProps) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function completeSignIn() {
      try {
        // The Neon Auth client exchanges neon_auth_session_verifier here and
        // removes it from the address bar once the session cookie is set.
        const result = await authClient.getSession();
        if (!isCurrent) return;
        if (result.error || !result.data?.user) {
          setError("La connexion n’a pas pu être finalisée. Réessaie.");
          return;
        }

        router.replace(destination);
        router.refresh();
      } catch {
        if (isCurrent) setError("La connexion n’a pas pu être finalisée. Réessaie.");
      }
    }

    void completeSignIn();
    return () => {
      isCurrent = false;
    };
  }, [destination, router]);

  return (
    <main className="page-shell flex min-h-dvh items-center py-12">
      <section className="mx-auto w-full max-w-md border border-border bg-surface p-7 text-center sm:p-9">
        {error ? (
          <>
            <h1 className="font-display text-4xl font-extrabold uppercase">Connexion interrompue</h1>
            <p role="alert" className="mt-4 text-sm leading-relaxed text-muted">{error}</p>
            <Link href={retryHref} className={cn(buttonVariants({ variant: "accent" }), "mt-7")}>
              Revenir à la connexion
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle aria-hidden="true" className="mx-auto size-8 animate-spin text-accent-strong" />
            <h1 className="font-display mt-5 text-4xl font-extrabold uppercase">Connexion en cours</h1>
            <p className="mt-3 text-sm text-muted">Sécurisation de ta session Peakfit…</p>
          </>
        )}
      </section>
    </main>
  );
}
