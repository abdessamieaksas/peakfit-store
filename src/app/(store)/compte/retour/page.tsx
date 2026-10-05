import type { Metadata } from "next";

import { AuthCallback } from "@/components/auth/auth-callback";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

export default function CustomerAuthCallbackPage() {
  return <AuthCallback destination="/compte" retryHref="/compte/connexion" />;
}
