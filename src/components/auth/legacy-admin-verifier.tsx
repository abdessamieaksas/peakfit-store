"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";

/**
 * Compatibility for the early admin Google callback URL, which returned to
 * the storefront root. New sign-ins use /admin/connexion/retour instead.
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
      const result = await authClient.getSession();
      if (isCurrent && !result.error && result.data?.user) {
        router.replace("/admin");
        router.refresh();
      }
    }

    void redeemLegacyVerifier();
    return () => {
      isCurrent = false;
    };
  }, [pathname, router, verifier]);

  return null;
}
