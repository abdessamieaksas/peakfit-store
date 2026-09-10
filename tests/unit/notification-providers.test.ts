import { afterEach, describe, expect, it, vi } from "vitest";

import {
  NotificationDeliveryError,
  type NotificationJob,
} from "@/features/notifications/domain/notification";
import {
  sendEmailNotification,
  sendWhatsAppNotification,
} from "@/features/notifications/server/providers";
import { renderOrderEmail } from "@/features/notifications/server/templates";

const originalEnv = { ...process.env };

const job: NotificationJob = {
  id: "11111111-1111-4111-8111-111111111111",
  orderId: "22222222-2222-4222-8222-222222222222",
  orderReference: "PF-260910-TEST1234",
  channel: "EMAIL",
  templateKey: "order_received",
  locale: "fr",
  recipient: "client@example.com",
  payload: {
    customerName: "<Samir>",
    reference: "PF-260910-TEST1234",
    total: 38400,
  },
  dedupeKey: "order:email:test",
  attempts: 1,
  maxAttempts: 5,
  leasedAt: new Date("2026-09-10T14:00:00.000Z"),
};

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("notification providers", () => {
  it("escapes customer content in the transactional email", () => {
    const email = renderOrderEmail(job);

    expect(email.subject).toContain(job.orderReference);
    expect(email.html).toContain("&lt;Samir&gt;");
    expect(email.html).not.toContain("<Samir>");
  });

  it("uses Resend idempotency and returns the provider message id", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Peakfit <orders@peakfit.example>";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(sendEmailNotification(job, fetcher)).resolves.toEqual({
      providerMessageId: "email_123",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": job.dedupeKey,
        }),
      }),
    );
  });

  it("defers WhatsApp cleanly until business credentials are configured", async () => {
    delete process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_ORDER_TEMPLATE_NAME;

    await expect(
      sendWhatsAppNotification({ ...job, channel: "WHATSAPP" }),
    ).rejects.toMatchObject<Partial<NotificationDeliveryError>>({
      code: "CHANNEL_NOT_CONFIGURED",
      retryable: true,
    });
  });
});
