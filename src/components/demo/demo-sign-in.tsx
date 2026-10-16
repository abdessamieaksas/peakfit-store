"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function DemoSignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "Connexion impossible. Réessaie.");
        return;
      }
      router.replace("/demo/admin");
      router.refresh();
    } catch {
      setError("Connexion impossible pour le moment. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="demo-email" className="mb-2 block text-sm font-bold">E-mail</label>
        <input id="demo-email" name="email" type="email" autoComplete="username" required className="min-h-12 w-full border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      </div>
      <div>
        <label htmlFor="demo-password" className="mb-2 block text-sm font-bold">Mot de passe</label>
        <input id="demo-password" name="password" type="password" autoComplete="current-password" required className="min-h-12 w-full border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      </div>
      {error ? <p role="alert" className="border border-danger/40 bg-danger/10 p-3 text-sm">{error}</p> : null}
      <button type="submit" disabled={busy} aria-busy={busy} className="min-h-12 w-full bg-foreground px-5 font-extrabold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">
        {busy ? "Connexion…" : "Ouvrir la démonstration"}
      </button>
    </form>
  );
}
