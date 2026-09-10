import "server-only";

import type { NotificationJob } from "@/features/notifications/domain/notification";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/features/orders/domain/status";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(payload: Record<string, unknown>) {
  const amount = typeof payload.total === "number" ? payload.total : 0;
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function renderOrderEmail(job: NotificationJob) {
  const name = escapeHtml(job.payload.customerName);
  const reference = escapeHtml(job.payload.reference ?? job.orderReference);
  const total = escapeHtml(money(job.payload));
  const isAdmin = job.templateKey === "order_received_admin";
  const isStatusUpdate = job.templateKey === "order_status_customer";
  const status = job.payload.status as OrderStatus | undefined;
  const statusLabel = status ? ORDER_STATUS_LABELS[status] : "Mise à jour";

  const subject = isAdmin
    ? `Nouvelle commande ${reference}`
    : isStatusUpdate
      ? `Commande ${reference} — ${statusLabel}`
      : `Commande Peakfit ${reference} reçue`;
  const details = isAdmin
    ? `<p><strong>Client :</strong> ${name}<br><strong>Téléphone :</strong> ${escapeHtml(job.payload.customerPhone)}<br><strong>Ville :</strong> ${escapeHtml(job.payload.city)}</p>`
    : isStatusUpdate
      ? `<p>Le statut de ta commande est maintenant : <strong>${escapeHtml(statusLabel)}</strong>.</p>`
      : "<p>Nous avons bien reçu ta commande. L’équipe Peakfit te contactera pour confirmer la livraison. Tu n’as aucun message à envoyer.</p>";

  return {
    subject,
    html: `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f2ef;color:#0b0b0d;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><p style="font-weight:800;letter-spacing:.12em">PEAKFIT</p><div style="background:#fff;border:1px solid #d9d5de;padding:28px"><h1 style="margin:0 0 18px;font-size:30px">${isAdmin ? "Nouvelle commande" : isStatusUpdate ? "Commande mise à jour" : `Merci ${name}`}</h1>${details}<p><strong>Référence :</strong> ${reference}<br><strong>Total à la livraison :</strong> ${total}</p></div><p style="color:#67636d;font-size:12px;line-height:1.5">Message transactionnel relatif à une commande Peakfit.</p></div></body></html>`,
  };
}

export function whatsappTemplateParameters(job: NotificationJob) {
  return [
    String(job.payload.customerName ?? ""),
    String(job.payload.reference ?? job.orderReference),
    money(job.payload),
  ];
}
