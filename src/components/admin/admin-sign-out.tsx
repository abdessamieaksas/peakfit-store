"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AdminSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/admin/connexion");
        router.refresh();
      }}
    >
      <LogOut aria-hidden="true" className="size-4" />
      {pending ? "Fermeture…" : "Déconnexion"}
    </Button>
  );
}
