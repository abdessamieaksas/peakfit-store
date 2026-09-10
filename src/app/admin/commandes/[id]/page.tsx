import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AdminHeader } from "@/components/admin/admin-header";
import { OrderStatusControls } from "@/components/admin/order-status-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/features/orders/domain/status";
import { getAdminOrder } from "@/features/orders/server/admin-order-repository";
import { canManageOrders, requireAdmin } from "@/lib/auth/access";
import { formatMad } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Détail commande", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const phone = order.customerPhone.replace(/[^\d+]/g, "");
  const whatsappPhone = order.customerPhone.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(`Bonjour ${order.customerName}, c’est Peakfit. Nous te contactons concernant ta commande ${order.reference} de ${formatMad(order.total)}.`);

  return (
    <>
      <AdminHeader access={access} />
      <main className="page-shell py-10 sm:py-14">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />Retour aux commandes</Link>
        <div className="mt-7 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Commande</p><h1 className="display-title mt-2 text-[clamp(3.7rem,9vw,7rem)]">{order.reference}</h1><p className="mt-3 text-sm text-muted">Créée le {dateTime(order.createdAt)}</p></div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
          <div className="grid gap-8">
            <section className="border border-border bg-surface p-5 sm:p-7">
              <h2 className="font-display text-3xl font-extrabold uppercase">Articles</h2>
              <div className="mt-5 divide-y divide-border border-y border-border">
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                    <div><strong className="block">{item.productName}</strong><span className="text-sm text-muted">{item.variantTitle} · {item.sku} · Qté {item.quantity}</span></div>
                    <strong>{formatMad(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              <dl className="ml-auto mt-5 grid max-w-sm grid-cols-[1fr_auto] gap-x-8 gap-y-2 text-sm">
                <dt className="text-muted">Sous-total</dt><dd className="font-bold">{formatMad(order.subtotal)}</dd>
                <dt className="text-muted">Livraison</dt><dd className="font-bold">{formatMad(order.shippingFee)}</dd>
                <dt className="border-t border-border pt-3 font-extrabold">Total à encaisser</dt><dd className="border-t border-border pt-3 text-lg font-extrabold">{formatMad(order.total)}</dd>
              </dl>
            </section>

            <section className="border border-border bg-surface p-5 sm:p-7">
              <h2 className="font-display text-3xl font-extrabold uppercase">Faire avancer</h2>
              <p className="mt-2 text-sm text-muted">Le stock est débité uniquement à la confirmation. Toute modification est historisée.</p>
              <div className="mt-5"><OrderStatusControls orderId={order.id} status={order.status} version={order.version} canManage={canManageOrders(access.role)} /></div>
            </section>

            <section className="border border-border bg-surface p-5 sm:p-7">
              <h2 className="font-display text-3xl font-extrabold uppercase">Historique</h2>
              <ol className="mt-5 border-l border-border pl-5">
                {order.history.map((entry) => (
                  <li key={entry.id} className="relative pb-5 last:pb-0 before:absolute before:-left-[1.48rem] before:top-1 before:size-2 before:rounded-full before:bg-accent-strong">
                    <strong className="block text-sm">{ORDER_STATUS_LABELS[entry.toStatus]}</strong>
                    <span className="text-xs text-muted">{dateTime(entry.createdAt)}{entry.reason ? ` · ${entry.reason}` : ""}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="grid content-start gap-6">
            <section className="border border-border bg-surface p-5">
              <h2 className="font-display text-2xl font-extrabold uppercase">Client</h2>
              <p className="mt-4 font-extrabold">{order.customerName}</p>
              <p className="mt-1 text-sm text-muted">{order.customerPhone}</p>
              {order.customerEmail ? <p className="mt-1 break-all text-sm text-muted">{order.customerEmail}</p> : null}
              <div className="mt-5 grid gap-2">
                <a href={`tel:${phone}`} className={cn(buttonVariants({ variant: "accent" }), "w-full")}><Phone aria-hidden="true" className="size-4" />Appeler</a>
                <a href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full")}><MessageCircle aria-hidden="true" className="size-4" />WhatsApp</a>
                {order.customerEmail ? <a href={`mailto:${order.customerEmail}`} className={cn(buttonVariants({ variant: "ghost" }), "w-full")}><Mail aria-hidden="true" className="size-4" />E-mail</a> : null}
              </div>
            </section>
            <section className="border border-border bg-surface p-5">
              <MapPin aria-hidden="true" className="size-5 text-accent-strong" />
              <h2 className="mt-3 font-display text-2xl font-extrabold uppercase">Livraison</h2>
              <address className="mt-4 text-sm not-italic leading-relaxed text-muted"><strong className="text-foreground">{order.city}</strong>{order.region ? `, ${order.region}` : ""}<br />{order.addressLine}{order.postalCode ? <><br />{order.postalCode}</> : null}</address>
              <p className="mt-4 border-t border-border pt-4 text-xs text-muted">{order.shippingZoneName} · {order.estimatedDaysMin}–{order.estimatedDaysMax} jours estimés</p>
              {order.customerNote ? <p className="mt-4 border-l-2 border-accent-strong pl-3 text-sm">{order.customerNote}</p> : null}
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
