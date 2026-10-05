import { PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CustomerSignOut } from "@/components/account/customer-sign-out";
import { StatusBadge } from "@/components/admin/status-badge";
import { listCustomerOrders } from "@/features/orders/server/customer-order-repository";
import { requireCustomer } from "@/lib/auth/access";
import { formatMad } from "@/lib/money";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}

export default async function CustomerAccountPage() {
  const customer = await requireCustomer();
  const orders = customer.emailVerified && customer.email
    ? await listCustomerOrders(customer.email)
    : [];
  const name = customer.displayName || customer.email || "Client Peakfit";

  return <section className="page-shell py-10 sm:py-14">
    <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Espace personnel</p><h1 className="display-title mt-3 text-[clamp(3.5rem,10vw,6.5rem)]">Bonjour, {name}</h1><p className="mt-4 max-w-xl text-muted">Connecte-toi avec une adresse e-mail vérifiée identique à celle utilisée lors de ta commande.</p></div>
      <CustomerSignOut />
    </header>
    <section className="mt-8"><h2 className="font-display text-3xl font-extrabold uppercase">Mes commandes</h2>
      {orders.length ? <div className="mt-5 overflow-hidden border border-border bg-surface">{orders.map((order) => <article key={order.id} className="grid gap-4 border-b border-border p-5 last:border-0 md:grid-cols-[1.2fr_auto_auto] md:items-center"><div><strong>{order.reference}</strong><p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)} · {order.items.map((item) => `${item.quantity} × ${item.productName} (${item.variantTitle})`).join(", ")}</p></div><StatusBadge status={order.status} /><strong className="text-lg tabular-nums">{formatMad(order.total)}</strong></article>)}</div> : <div className="mt-5 border border-dashed border-border py-16 text-center"><PackageCheck aria-hidden="true" className="mx-auto size-8 text-muted" /><h2 className="mt-4 font-display text-3xl font-extrabold uppercase">{customer.emailVerified ? "Pas encore de commande trouvée" : "Vérifie ton adresse e-mail"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">{customer.emailVerified ? "Les commandes passées avec cette adresse vérifiée apparaîtront ici. Les commandes invitées avec une autre adresse restent privées." : "Pour protéger tes achats, l’historique s’affiche seulement après vérification de ton adresse e-mail."}</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-bold text-on-accent hover:bg-accent-strong">Découvrir les produits</Link></div>}
    </section>
  </section>;
}
