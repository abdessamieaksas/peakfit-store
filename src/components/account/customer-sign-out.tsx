"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function CustomerSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return <Button type="button" variant="outline" disabled={pending} onClick={async () => {
    setPending(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }}><LogOut aria-hidden="true" className="size-4" />{pending ? "Déconnexion…" : "Déconnexion"}</Button>;
}
