import { Suspense, type ReactNode } from "react";

import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { LegacyAdminVerifier } from "@/components/auth/legacy-admin-verifier";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <LegacyAdminVerifier />
      </Suspense>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
