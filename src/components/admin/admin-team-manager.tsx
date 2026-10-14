"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

type StaffRole = "OWNER" | "MANAGER" | "FULFILMENT" | "VIEWER";
type Member = { authUserId: string; email: string | null; displayName: string; role: StaffRole; isActive: boolean };
type Invitation = { email: string; displayName: string; role: Exclude<StaffRole, "OWNER">; createdAt: string };

const roleLabels: Record<StaffRole, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Manager — catalogue et commandes",
  FULFILMENT: "Préparation — commandes",
  VIEWER: "Lecture seule",
};

export function AdminTeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/team", { cache: "no-store" });
      const data = await response.json() as { members?: Member[]; invitations?: Invitation[] };
      if (!response.ok) throw new Error("Impossible de charger l’équipe.");
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  async function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const displayName = String(form.get("displayName") ?? "").trim();
    if (!displayName || displayName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Indique un nom et une adresse e-mail valides.");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, role: form.get("role") }),
      });
      const data = await response.json() as { error?: { code?: string } };
      if (!response.ok) throw new Error(data.error?.code === "ALREADY_MEMBER" ? "Cette personne fait déjà partie de l’équipe." : "Invitation impossible. Vérifie l’adresse et réessaie.");
      formElement.reset();
      setNotice("Accès préparé. Aucun e-mail n’est envoyé automatiquement : partage l’adresse de connexion. La personne devra utiliser cette adresse vérifiée.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur lors de l’invitation.");
    } finally { setSaving(false); }
  }

  async function updateMember(member: Member, changes: { role?: Exclude<StaffRole, "OWNER">; isActive?: boolean }) {
    setError(""); setNotice(""); setSaving(true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUserId: member.authUserId, ...changes }),
      });
      if (!response.ok) throw new Error("Modification non enregistrée. Réessaie.");
      setNotice("Rôle mis à jour.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur de modification.");
    } finally { setSaving(false); }
  }

  async function cancelInvitation(email: string) {
    setError(""); setNotice(""); setSaving(true);
    try {
      const response = await fetch("/api/admin/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error("Impossible d’annuler l’invitation.");
      setNotice("Invitation annulée.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur d’annulation.");
    } finally { setSaving(false); }
  }

  return <div className="grid gap-10 lg:grid-cols-[minmax(18rem,.8fr)_1.2fr]">
    <section className="self-start border border-border bg-surface p-5 sm:p-7">
      <h2 className="font-display text-3xl font-extrabold uppercase">Ajouter un accès</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Invite une personne par e-mail. Son accès s’active seulement après connexion avec cette adresse vérifiée.</p>
      <form className="mt-6 grid gap-4" onSubmit={submitInvitation} noValidate>
        <label className="grid gap-2 text-sm font-bold">Nom<input name="displayName" required maxLength={120} autoComplete="name" className="min-h-11 rounded-md border border-border bg-background px-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-bold">E-mail<input name="email" type="email" required autoComplete="email" className="min-h-11 rounded-md border border-border bg-background px-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-bold">Rôle<select name="role" defaultValue="FULFILMENT" className="min-h-11 rounded-md border border-border bg-background px-3 font-normal"><option value="MANAGER">{roleLabels.MANAGER}</option><option value="FULFILMENT">{roleLabels.FULFILMENT}</option><option value="VIEWER">{roleLabels.VIEWER}</option></select></label>
        <Button type="submit" variant="accent" disabled={saving}><UserPlus aria-hidden="true" className="size-4" />{saving ? "Enregistrement…" : "Préparer l’accès"}</Button>
      </form>
    </section>

    <section>
      <h2 className="font-display text-3xl font-extrabold uppercase">Membres</h2>
      {error ? <p role="alert" className="mt-4 border border-danger/35 bg-danger/10 p-4 text-sm font-bold text-danger">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 border border-success/35 bg-success/10 p-4 text-sm font-bold">{notice}</p> : null}
      {loading ? <p className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Chargement de l’équipe…</p> : <ul className="mt-5 divide-y divide-border border-y border-border">
        {members.map((member) => <li key={member.authUserId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold">{member.displayName}{member.role === "OWNER" ? <span className="ml-2 text-xs font-semibold text-accent-strong">Propriétaire</span> : null}</p><p className="text-sm text-muted">{member.email ?? "E-mail à actualiser à la prochaine connexion"}{!member.isActive ? " · Suspendu" : ""}</p></div>
          {member.role === "OWNER" ? <span className="text-sm font-bold">{roleLabels.OWNER}</span> : <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`role-${member.authUserId}`}>Rôle de {member.displayName}</label>
            <select id={`role-${member.authUserId}`} value={member.role} disabled={saving} onChange={(event) => void updateMember(member, { role: event.target.value as Exclude<StaffRole, "OWNER"> })} className="min-h-10 max-w-64 rounded-md border border-border bg-background px-2 text-xs font-semibold"><option value="MANAGER">Manager</option><option value="FULFILMENT">Préparation</option><option value="VIEWER">Lecture seule</option></select>
            <button type="button" disabled={saving} onClick={() => void updateMember(member, { isActive: !member.isActive })} className="min-h-10 px-2 text-xs font-bold underline underline-offset-4">{member.isActive ? "Suspendre" : "Réactiver"}</button>
          </div>}
        </li>)}
      </ul>}

      <h2 className="mt-9 font-display text-2xl font-extrabold uppercase">Accès en attente</h2>
      {invitations.length ? <ul className="mt-4 divide-y divide-border border-y border-border">{invitations.map((invite) => <li key={invite.email} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{invite.displayName}</p><p className="text-sm text-muted">{invite.email} · {roleLabels[invite.role]}</p></div><button type="button" disabled={saving} onClick={() => void cancelInvitation(invite.email)} className="min-h-10 self-start text-sm font-bold text-danger underline underline-offset-4">Annuler</button></li>)}</ul> : <p className="mt-3 text-sm text-muted">Aucune invitation en attente.</p>}
    </section>
  </div>;
}
