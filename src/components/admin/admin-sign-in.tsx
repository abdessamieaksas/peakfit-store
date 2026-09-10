"use client";

import { LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AdminSignIn({ reason }: { reason?: string }) {
  const router = useRouter();
  const [error, setError] = useState(
    reason === "forbidden"
      ? "Ce compte n’a pas accès à l’espace Peakfit. Utilise l’adresse autorisée."
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  async function signIn(event: FormEvent<HTMLFormElement>) {
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
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: String(data.get("name") ?? "Équipe Peakfit").trim(),
            });
      if (result.error) {
        setError(
          mode === "sign-in"
            ? "Connexion refusée. Vérifie tes identifiants."
            : "Impossible de créer cet accès. Vérifie les informations ou connecte-toi.",
        );
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Connexion indisponible. Réessaie dans un instant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={signIn} noValidate aria-busy={isSubmitting}>
      {error ? (
        <p role="alert" className="border border-danger/35 bg-danger/10 p-4 text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
      {mode === "sign-up" ? (
        <div>
          <label htmlFor="admin-name" className="text-sm font-extrabold">Nom</label>
          <input
            id="admin-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
          />
        </div>
      ) : null}
      <div>
        <label htmlFor="admin-email" className="text-sm font-extrabold">E-mail</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="text-sm font-extrabold">Mot de passe</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 min-h-12 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        />
      </div>
      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : mode === "sign-in" ? (
          <LockKeyhole aria-hidden="true" className="size-5" />
        ) : (
          <UserPlus aria-hidden="true" className="size-5" />
        )}
        {isSubmitting
          ? "Patiente…"
          : mode === "sign-in"
            ? "Ouvrir l’espace équipe"
            : "Créer mon accès"}
      </Button>
      <button
        type="button"
        className="min-h-11 text-sm font-bold text-muted underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => {
          setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
          setError("");
        }}
      >
        {mode === "sign-in" ? "Premier accès ? Créer le compte" : "Compte existant ? Se connecter"}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        Créer un compte ne donne pas automatiquement accès : seule l’adresse autorisée par Peakfit peut ouvrir le tableau de bord.
      </p>
    </form>
  );
}
