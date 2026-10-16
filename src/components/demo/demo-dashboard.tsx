"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from "@/features/orders/domain/status";
import { DEMO_ORDERS, DEMO_PRODUCTS, type DemoOrder } from "@/lib/demo/sample-data";

const money = new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 });

export function DemoDashboard() {
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [notice, setNotice] = useState("");
  const summary = useMemo(() => ({
    today: orders.filter((order) => order.date.startsWith("Aujourd’hui")).length,
    pending: orders.filter((order) => ["NEW", "CONTACTED"].includes(order.status)).length,
    month: orders.length,
    confirmedValue: orders.filter((order) => ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status)).reduce((total, order) => total + order.total, 0),
  }), [orders]);

  function changeStatus(orderId: string, status: OrderStatus) {
    const current = orders.find((order) => order.id === orderId);
    if (!current || !ORDER_TRANSITIONS[current.status].includes(status)) return;
    setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? { ...order, status } : order));
    setNotice(`${orderId} · statut simulé : ${ORDER_STATUS_LABELS[status]}. Aucun changement n’a été enregistré.`);
  }

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="border border-warning/40 bg-warning/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-warning">Mode démonstration</p><p className="mt-1 text-sm leading-relaxed">Données entièrement fictives. Les changements de statut sont temporaires et ne touchent pas la boutique réelle.</p></div>
        <Link href="/" className="mt-3 inline-flex min-h-11 items-center text-sm font-extrabold underline underline-offset-4 sm:mt-0">Voir la boutique</Link>
      </div>
      <header className="border-b border-border py-8 sm:py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Peakfit · Aperçu commerçant</p>
        <h1 className="display-title mt-3 text-[clamp(3.5rem,9vw,6rem)]">Tableau de bord</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">Un aperçu fictif de la gestion des commandes COD et du stock par variante.</p>
      </header>

      <section aria-label="Indicateurs démo" className="grid gap-px border-b border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Nouvelles aujourd’hui", String(summary.today), "Commandes fictives reçues aujourd’hui"],
          ["À confirmer", String(summary.pending), "Nouvelles ou client contacté"],
          ["Commandes ce mois", String(summary.month), "Échantillon fictif de commandes"],
          ["Valeur COD confirmée", money.format(summary.confirmedValue), "Valeur indicative, pas de l’argent encaissé"],
        ].map(([label, value, detail]) => <article key={label} className="min-w-0 bg-background p-5 sm:p-6"><h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">{label}</h2><p className="mt-3 break-words font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{value}</p><p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p></article>)}
      </section>

      <section aria-labelledby="demo-orders-heading" className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Traitement</p><h2 id="demo-orders-heading" className="mt-2 font-display text-3xl font-extrabold uppercase">Commandes récentes</h2></div><span className="border border-border px-3 py-2 text-xs font-bold">{orders.length} exemples</span></div>
        {notice ? <p role="status" aria-live="polite" className="mt-4 border border-success/40 bg-success/10 p-3 text-sm">{notice}</p> : null}
        <div className="mt-5 divide-y divide-border border-y border-border">
          {orders.map((order) => <DemoOrderCard key={order.id} order={order} onStatusChange={changeStatus} />)}
        </div>
      </section>

      <section aria-labelledby="demo-stock-heading" className="border-t border-border py-8">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Inventaire</p><h2 id="demo-stock-heading" className="mt-2 font-display text-3xl font-extrabold uppercase">Stock par variante</h2></div>
        <ul className="mt-5 divide-y divide-border border-y border-border">{DEMO_PRODUCTS.map((product) => <li key={product.name} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8"><div><p className="font-bold">{product.name}</p><p className="text-sm text-muted">{product.variant}</p></div><span className={product.stock <= 2 ? "text-sm font-extrabold text-warning" : "text-sm font-bold"}>{product.stock === 0 ? "Rupture" : `${product.stock} disponible${product.stock > 1 ? "s" : ""}`}</span><span className="text-sm font-bold">{money.format(product.price)}</span></li>)}</ul>
      </section>
      <footer className="border-t border-border py-6 text-xs leading-relaxed text-muted">Toutes les fiches, identités, coordonnées et commandes affichées sur cette page sont fictives. Les numéros sont réservés aux exemples de démonstration.</footer>
    </main>
  );
}

function DemoOrderCard({ order, onStatusChange }: { order: DemoOrder; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const nextStatuses = ORDER_TRANSITIONS[order.status];
  return (
    <article className="grid gap-4 py-5 md:grid-cols-[1.1fr_1.3fr_.9fr_auto] md:items-center md:gap-5">
      <div><p className="font-extrabold">{order.id}</p><p className="mt-1 text-xs text-muted">{order.date} · COD</p></div>
      <div><p className="font-bold">{order.customer}</p><p className="mt-1 text-xs text-muted">{order.city} · {order.phone}</p><p className="mt-2 text-sm">{order.items}</p></div>
      <div><span className="inline-flex border border-accent-strong/40 bg-accent/20 px-3 py-1 text-xs font-extrabold">{ORDER_STATUS_LABELS[order.status]}</span><label htmlFor={`status-${order.id}`} className="sr-only">Simuler le prochain statut pour {order.id}</label><select id={`status-${order.id}`} value="" disabled={nextStatuses.length === 0} onChange={(event) => { if (event.target.value) onStatusChange(order.id, event.target.value as OrderStatus); }} className="mt-2 block min-h-10 w-full border border-border bg-background px-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label={`Simuler le prochain statut pour ${order.id}`}><option value="">{nextStatuses.length ? "Simuler un changement…" : "Statut final"}</option>{nextStatuses.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}</select></div>
      <strong className="text-sm tabular-nums">{money.format(order.total)}</strong>
    </article>
  );
}
