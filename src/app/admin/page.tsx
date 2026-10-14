import { ArrowUpRight, Inbox, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { LOW_STOCK_THRESHOLD } from "@/features/inventory/domain/stock-level";
import { getLowStockOverview } from "@/features/inventory/server/admin-inventory-repository";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/features/orders/domain/status";
import { getAdminDashboardMetrics } from "@/features/orders/server/admin-dashboard-repository";
import {
  countOrdersByStatus,
  listAdminOrders,
} from "@/features/orders/server/admin-order-repository";
import { requireAdmin } from "@/lib/auth/access";
import { formatMad } from "@/lib/money";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
  const [orders, counts, metrics, lowStock] = await Promise.all([
    listAdminOrders(status),
    countOrdersByStatus(),
    getAdminDashboardMetrics(),
    getLowStockOverview(),
  ]);
  const metricCards = [
    {
      label: "Nouvelles aujourd’hui",
      value: new Intl.NumberFormat("fr-MA").format(metrics.newOrdersToday),
      detail: "Reçues depuis minuit, heure du Maroc",
    },
    {
      label: "À confirmer",
      value: new Intl.NumberFormat("fr-MA").format(metrics.ordersAwaitingConfirmation),
      detail: "Nouvelles ou client déjà contacté",
    },
    {
      label: "Commandes ce mois",
      value: new Intl.NumberFormat("fr-MA").format(metrics.ordersThisMonth),
      detail: "Créées depuis le début du mois",
    },
    {
      label: "Valeur COD confirmée",
      value: formatMad(metrics.confirmedCodValueThisMonth),
      detail: "Commandes de ce mois confirmées, hors retours — pas un chiffre de caisse",
    },
  ];

  return (
    <>
      <AdminHeader access={access} />
      <main className="page-shell py-10 sm:py-14">
        <section className="border-b border-border pb-9">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Pilotage quotidien</p>
            <h1 className="display-title mt-3 text-[clamp(4rem,10vw,7.5rem)]">Tableau de bord</h1>
            <p className="mt-4 max-w-xl text-muted">Tout ce qui demande ton attention, sans tableur ni message envoyé par le client.</p>
          </div>
        </section>

        <section aria-label="Indicateurs des commandes" className="grid gap-px border-b border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <article key={metric.label} className="min-w-0 bg-background p-5 sm:p-6">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">{metric.label}</h2>
              <p className="mt-3 break-words font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{metric.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="low-stock-heading" className="border-b border-border py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Inventaire</p>
              <h2 id="low-stock-heading" className="mt-2 font-display text-3xl font-extrabold uppercase">Tailles à réapprovisionner</h2>
              <p className="mt-1 text-sm text-muted">Variantes actives avec {LOW_STOCK_THRESHOLD} pièces disponibles ou moins, après réservations.</p>
            </div>
            {lowStock.totalVariants > 0 ? (
              <p className="inline-flex items-center gap-2 text-sm font-bold text-warning">
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                {lowStock.totalVariants} variante{lowStock.totalVariants > 1 ? "s" : ""} à surveiller
              </p>
            ) : (
              <p className="text-sm font-bold text-success">Toutes les tailles ont plus de {LOW_STOCK_THRESHOLD} pièces disponibles.</p>
            )}
          </div>

          {lowStock.variants.length > 0 && (
            <ul className="mt-5 divide-y divide-border border-y border-border" aria-label="Variantes avec stock faible">
              {lowStock.variants.map((variant) => (
                <li key={variant.sku}>
                  <Link href={`/admin/produits/${variant.productId}`} className="group grid min-h-16 gap-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-5">
                  <div className="min-w-0">
                    <p className="truncate font-bold group-hover:underline">{variant.productName}</p>
                    <p className="mt-0.5 text-xs text-muted">{variant.variantTitle} · SKU {variant.sku}</p>
                  </div>
                  <p className={`text-sm font-extrabold tabular-nums ${variant.availableQuantity === 0 ? "text-danger" : "text-warning"}`}>
                    <span className="sr-only">Stock disponible après réservations : </span>
                    {variant.availableQuantity === 0 ? "Rupture" : `${variant.availableQuantity} disponible${variant.availableQuantity > 1 ? "s" : ""}`}
                  </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {lowStock.totalVariants > lowStock.variants.length && (
            <p className="mt-3 text-xs text-muted">Les {lowStock.variants.length} variantes les plus urgentes sont affichées.</p>
          )}
        </section>

        <section aria-labelledby="orders-heading" className="pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Traitement</p>
              <h2 id="orders-heading" className="mt-2 font-display text-3xl font-extrabold uppercase">Commandes</h2>
            </div>
          </div>
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
        </section>
      </main>
    </>
  );
}
