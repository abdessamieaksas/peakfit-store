import { z } from "zod";

export const notificationChannelSchema = z.enum(["EMAIL", "WHATSAPP"]);

export const notificationJobSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  orderReference: z.string().min(1).max(32),
  channel: notificationChannelSchema,
  templateKey: z.string().min(1).max(100),
  locale: z.string().min(2).max(16),
  recipient: z.string().min(1).max(254),
  payload: z.record(z.string(), z.unknown()),
  dedupeKey: z.string().min(1).max(180),
  attempts: z.coerce.number().int().positive(),
  maxAttempts: z.coerce.number().int().positive(),
  leasedAt: z.coerce.date(),
});

export type NotificationJob = z.infer<typeof notificationJobSchema>;

export type DeliveryResult = {
  providerMessageId: string;
};

export class NotificationDeliveryError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "NotificationDeliveryError";
  }
}
