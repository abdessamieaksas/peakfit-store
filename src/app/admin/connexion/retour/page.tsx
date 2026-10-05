import type { Metadata } from "next";

import { AuthCallback } from "@/components/auth/auth-callback";

export const metadata: Metadata = {
  title: "Connexion équipe",
  robots: { index: false, follow: false },
};

export default function AdminAuthCallbackPage() {
  return <AuthCallback destination="/admin" retryHref="/admin/connexion" />;
}
