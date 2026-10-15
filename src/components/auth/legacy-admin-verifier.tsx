"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";

/**
 * Compatibility for the early admin Google callback URL, which returned to
 * the storefront root. New sign-ins use the shared /connexion/retour route.
 */
export function LegacyAdminVerifier() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifier = searchParams.get("neon_auth_session_verifier");

  useEffect(() => {
    if (pathname !== "/" || !verifier) return;

    let isCurrent = true;
    async function redeemLegacyVerifier() {
      try {
        const result = await authClient.getSession();
        if (!isCurrent) return;
        if (result.error || !result.data?.user) {
          router.replace("/connexion?reason=callback");
          return;
        }

        const destinationResult = await fetch("/api/auth/destination", { cache: "no-store" });
        const destinationData = await destinationResult.json() as { destination?: "/admin" | "/compte" };
        if (!isCurrent) return;
        if (!destinationResult.ok || !destinationData.destination) {
          router.replace("/connexion?reason=callback");
          return;
        }

        router.replace(destinationData.destination);
        router.refresh();
      } catch {
        if (isCurrent) router.replace("/connexion?reason=callback");
      }
    }

    void redeemLegacyVerifier();
    return () => {
      isCurrent = false;
    };
  }, [pathname, router, verifier]);

  return null;
}
