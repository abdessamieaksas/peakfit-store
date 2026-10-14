import { redirect } from "next/navigation";

export default async function LegacyAdminSignInPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  redirect(reason ? `/connexion?reason=${encodeURIComponent(reason)}` : "/connexion");
}
