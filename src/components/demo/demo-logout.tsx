"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/demo/session", { method: "DELETE" });
      router.replace("/demo/connexion");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" onClick={logout} disabled={busy} className="min-h-11 border border-border px-4 text-sm font-bold hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">{busy ? "Déconnexion…" : "Quitter la démo"}</button>;
}
