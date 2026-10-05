"use client";

import { LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function CustomerSignIn() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  async function signInWithGoogle() {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: new URL("/compte/retour", window.location.origin).toString(),
      });
      if (result.error) setError("Connexion Google indisponible. Réessaie ou utilise ton e-mail.");
    } catch {
      setError("Connexion Google indisponible. Réessaie ou utilise ton e-mail.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Indique ton e-mail et ton mot de passe.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const result = mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: String(data.get("name") ?? "Client Peakfit").trim() || "Client Peakfit",
          });
      if (result.error) {
        setError(mode === "sign-in" ? "Connexion refusée. Vérifie tes identifiants." : "Impossible de créer ce compte. Vérifie les informations ou connecte-toi.");
        return;
      }
      router.replace("/compte");
      router.refresh();
    } catch {
      setError("Connexion indisponible. Réessaie dans un instant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={submit} noValidate aria-busy={isSubmitting}>
      {error ? <p role="alert" className="border border-danger/35 bg-danger/10 p-4 text-sm font-bold text-danger">{error}</p> : null}
      <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={signInWithGoogle}>
        Continuer avec Google
      </Button>
      <p className="-mt-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-muted">ou avec e-mail</p>
      {mode === "sign-up" ? (
        <div>
          <label htmlFor="customer-name" className="text-sm font-extrabold">Nom</label>
          <input id="customer-name" name="name" type="text" autoComplete="name" required className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
        </div>
      ) : null}
      <div>
        <label htmlFor="customer-email" className="text-sm font-extrabold">E-mail</label>
        <input id="customer-email" name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
      </div>
      <div>
        <label htmlFor="customer-password" className="text-sm font-extrabold">Mot de passe</label>
        <input id="customer-password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={8} className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
        {mode === "sign-up" ? <p className="mt-2 text-xs text-muted">Au moins 8 caractères. Utilise un mot de passe unique.</p> : null}
      </div>
      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : mode === "sign-in" ? <LockKeyhole aria-hidden="true" className="size-5" /> : <UserPlus aria-hidden="true" className="size-5" />}
        {isSubmitting ? "Patiente…" : mode === "sign-in" ? "Accéder à mes commandes" : "Créer mon compte"}
      </Button>
      <button type="button" className="min-h-11 text-sm font-bold text-muted underline-offset-4 hover:text-foreground hover:underline" onClick={() => { setMode((current) => current === "sign-in" ? "sign-up" : "sign-in"); setError(""); }}>
        {mode === "sign-in" ? "Premier achat ? Créer un compte" : "Compte existant ? Se connecter"}
      </button>
    </form>
  );
}
