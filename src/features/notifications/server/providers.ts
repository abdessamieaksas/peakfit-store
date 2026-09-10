import "server-only";

import {
  NotificationDeliveryError,
  type DeliveryResult,
  type NotificationJob,
} from "@/features/notifications/domain/notification";
import { getServerEnv } from "@/lib/config/env";
import {
  renderOrderEmail,
  whatsappTemplateParameters,
} from "@/features/notifications/server/templates";

type Fetch = typeof fetch;

function readProviderId(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.id === "string") return record.id;

  const messages = record.messages;
  if (!Array.isArray(messages) || !messages[0] || typeof messages[0] !== "object") {
    return null;
  }
  const messageId = (messages[0] as Record<string, unknown>).id;
  return typeof messageId === "string" ? messageId : null;
}

async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

export async function sendEmailNotification(
  job: NotificationJob,
  fetcher: Fetch = fetch,
): Promise<DeliveryResult> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new NotificationDeliveryError(
      "CHANNEL_NOT_CONFIGURED",
      true,
      "Email delivery is not configured.",
    );
  }

  const template = renderOrderEmail(job);
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": job.dedupeKey,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [job.recipient],
      subject: template.subject,
      html: template.html,
    }),
  });
  const body = await readJson(response);
  const providerMessageId = readProviderId(body);

  if (!response.ok || !providerMessageId) {
    throw new NotificationDeliveryError(
      `RESEND_${response.status}`,
      response.status === 429 || response.status >= 500,
      "Resend rejected the notification.",
    );
  }

  return { providerMessageId };
}

export async function sendWhatsAppNotification(
  job: NotificationJob,
  fetcher: Fetch = fetch,
): Promise<DeliveryResult> {
  const env = getServerEnv();
  if (
    !env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID ||
    !env.WHATSAPP_ACCESS_TOKEN ||
    !env.WHATSAPP_ORDER_TEMPLATE_NAME
  ) {
    throw new NotificationDeliveryError(
      "CHANNEL_NOT_CONFIGURED",
      true,
      "WhatsApp delivery is not configured.",
    );
  }

  const parameters = whatsappTemplateParameters(job).map((text) => ({
    type: "text" as const,
    text,
  }));
  const response = await fetcher(
    `https://graph.facebook.com/${env.WHATSAPP_GRAPH_API_VERSION}/${env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: job.recipient.replace(/^\+/, ""),
        type: "template",
        template: {
          name: env.WHATSAPP_ORDER_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE },
          components: [{ type: "body", parameters }],
        },
      }),
    },
  );
  const body = await readJson(response);
  const providerMessageId = readProviderId(body);

  if (!response.ok || !providerMessageId) {
    throw new NotificationDeliveryError(
      `WHATSAPP_${response.status}`,
      response.status === 429 || response.status >= 500,
      "WhatsApp rejected the notification.",
    );
  }

  return { providerMessageId };
}

export function deliverNotification(job: NotificationJob, fetcher: Fetch = fetch) {
  return job.channel === "EMAIL"
    ? sendEmailNotification(job, fetcher)
    : sendWhatsAppNotification(job, fetcher);
}
