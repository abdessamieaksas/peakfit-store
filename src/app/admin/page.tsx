import { ArrowUpRight, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/features/orders/domain/status";
import {
  countOrdersByStatus,
  listAdminOrders,
} from "@/features/orders/server/admin-order-repository";
import { requireAdmin } from "@/lib/auth/access";
import { formatMad } from "@/lib/money";

export const metadata: Metadata = {
  title: "Accès équipe",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const activeStatuses: OrderStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "PREPARING", "SHIPPED"];

function parseStatus(value?: string): OrderStatus | undefined {
  return ORDER_STATUSES.find((status) => status === value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const access = await requireAdmin();
  const status = parseStatus((await searchParams).statut);
  const [orders, counts] = await Promise.all([
    listAdminOrders(status),
    countOrdersByStatus(),
  ]);
  const activeCount = activeStatuses.reduce((total, item) => total + (counts.get(item) ?? 0), 0);

  return (
    <>
      <AdminHeader access={access} />
      <main className="page-shell py-10 sm:py-14">
        <section className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Pilotage quotidien</p>
            <h1 className="display-title mt-3 text-[clamp(4rem,10vw,7.5rem)]">Commandes</h1>
            <p className="mt-4 max-w-xl text-muted">Tout ce qui demande ton attention, sans tableur ni message envoyé par le client.</p>
          </div>
          <div className="border border-border bg-surface p-5">
            <span className="font-display text-5xl font-extrabold">{activeCount}</span>
            <span className="ml-3 text-sm font-bold text-muted">en cours</span>
          </div>
        </section>

        <nav aria-label="Filtrer les commandes" className="flex gap-2 overflow-x-auto py-6">
          <Link href="/admin" className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${!status ? "border-foreground bg-foreground text-background" : "border-border bg-surface"}`}>
            Toutes
          </Link>
          {ORDER_STATUSES.map((item) => (
            <Link key={item} href={`/admin?statut=${item}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${status === item ? "border-foreground bg-foreground text-background" : "border-border bg-surface"}`}>
              {ORDER_STATUS_LABELS[item]} · {counts.get(item) ?? 0}
            </Link>
          ))}
        </nav>

        {orders.length ? (
          <div className="overflow-hidden border border-border bg-surface">
            <div className="hidden grid-cols-[1.1fr_1.3fr_.9fr_.8fr_auto] gap-5 border-b border-border px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted md:grid">
              <span>Commande</span><span>Client</span><span>Statut</span><span>Total</span><span className="sr-only">Ouvrir</span>
            </div>
            {orders.map((order) => (
              <Link key={order.id} href={`/admin/commandes/${order.id}`} className="group grid gap-4 border-b border-border px-5 py-5 last:border-0 hover:bg-surface-raised md:grid-cols-[1.1fr_1.3fr_.9fr_.8fr_auto] md:items-center md:gap-5">
                <div><strong className="block">{order.reference}</strong><span className="text-xs text-muted">{formatDate(order.createdAt)} · {order.itemCount} article{order.itemCount > 1 ? "s" : ""}</span></div>
                <div><strong className="block text-sm">{order.customerName}</strong><span className="text-xs text-muted">{order.city} · {order.customerPhone}</span></div>
                <StatusBadge status={order.status} />
                <strong>{formatMad(order.total)}</strong>
                <ArrowUpRight aria-hidden="true" className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border py-16 text-center">
            <Inbox aria-hidden="true" className="mx-auto size-8 text-muted" />
            <h2 className="mt-4 font-display text-3xl font-extrabold uppercase">Aucune commande</h2>
            <p className="mt-2 text-sm text-muted">Cette file est à jour.</p>
          </div>
        )}
      </main>
    </>
  );
}
