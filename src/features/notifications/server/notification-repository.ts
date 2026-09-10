import "server-only";

import { sql } from "drizzle-orm";

import {
  notificationJobSchema,
  type NotificationJob,
} from "@/features/notifications/domain/notification";
import { getServerEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";

export async function ensureAdminOrderNotification(orderReference?: string) {
  const env = getServerEnv();
  if (!env.ADMIN_ORDER_EMAIL) return;

  await getDb().execute(sql`
    INSERT INTO public.notification_outbox (
      order_id,
      channel,
      kind,
      recipient,
      template_key,
      locale,
      payload,
      dedupe_key
    )
    SELECT
      "order".id,
      'EMAIL',
      'ORDER_RECEIVED',
      ${env.ADMIN_ORDER_EMAIL},
      'order_received_admin',
      'fr',
      jsonb_build_object(
        'customerName', "order".customer_name,
        'customerPhone', "order".customer_phone,
        'city', "order".city,
        'reference', "order".reference,
        'total', "order".total,
        'currency', "order".currency
      ),
      "order".id::text || ':email:order_received_admin'
    FROM public.orders AS "order"
    WHERE (${orderReference ?? null}::text IS NULL OR "order".reference = ${orderReference ?? null})
    ON CONFLICT (dedupe_key) DO NOTHING
  `);
}

export async function claimNotificationJobs(
  limit: number,
  orderReference?: string,
): Promise<NotificationJob[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 25));
  const result = await getDb().execute(sql`
    WITH candidates AS (
      SELECT outbox.id
      FROM public.notification_outbox AS outbox
      JOIN public.orders AS "order" ON "order".id = outbox.order_id
      WHERE (${orderReference ?? null}::text IS NULL OR "order".reference = ${orderReference ?? null})
        AND (
          (outbox.status IN ('PENDING', 'FAILED') AND outbox.available_at <= now())
          OR (outbox.status = 'PROCESSING' AND outbox.leased_at < now() - interval '10 minutes')
        )
        AND outbox.attempts < outbox.max_attempts
      ORDER BY outbox.available_at, outbox.created_at, outbox.id
      FOR UPDATE OF outbox SKIP LOCKED
      LIMIT ${boundedLimit}
    ), claimed AS (
      UPDATE public.notification_outbox AS outbox
      SET
        status = 'PROCESSING',
        attempts = outbox.attempts + 1,
        leased_at = now(),
        updated_at = now()
      FROM candidates
      WHERE outbox.id = candidates.id
      RETURNING outbox.*
    )
    SELECT
      claimed.id,
      claimed.order_id AS "orderId",
      "order".reference AS "orderReference",
      claimed.channel,
      claimed.template_key AS "templateKey",
      claimed.locale,
      claimed.recipient,
      claimed.payload,
      claimed.dedupe_key AS "dedupeKey",
      claimed.attempts,
      claimed.max_attempts AS "maxAttempts",
      claimed.leased_at AS "leasedAt"
    FROM claimed
    JOIN public.orders AS "order" ON "order".id = claimed.order_id
    ORDER BY claimed.created_at, claimed.id
  `);

  return result.rows.map((row) => notificationJobSchema.parse(row));
}

export async function markNotificationSent(
  job: NotificationJob,
  providerMessageId: string,
) {
  await getDb().execute(sql`
    UPDATE public.notification_outbox
    SET
      status = 'SENT',
      sent_at = now(),
      provider_message_id = ${providerMessageId},
      last_error_code = NULL,
      updated_at = now()
    WHERE id = ${job.id}::uuid
      AND status = 'PROCESSING'
      AND leased_at = ${job.leasedAt.toISOString()}::timestamptz
  `);
}

export async function releaseUnconfiguredNotification(job: NotificationJob) {
  await getDb().execute(sql`
    UPDATE public.notification_outbox
    SET
      status = 'PENDING',
      attempts = greatest(attempts - 1, 0),
      available_at = now() + interval '1 day',
      leased_at = NULL,
      last_error_code = 'CHANNEL_NOT_CONFIGURED',
      updated_at = now()
    WHERE id = ${job.id}::uuid
      AND status = 'PROCESSING'
      AND leased_at = ${job.leasedAt.toISOString()}::timestamptz
  `);
}

export async function markNotificationFailed(
  job: NotificationJob,
  errorCode: string,
  retryable: boolean,
) {
  const status = retryable && job.attempts < job.maxAttempts ? "FAILED" : "CANCELLED";
  const retryMinutes = Math.min(6 * 60, 2 ** Math.min(job.attempts, 8));

  await getDb().execute(sql`
    UPDATE public.notification_outbox
    SET
      status = ${status}::notification_status,
      available_at = now() + make_interval(mins => ${retryMinutes}),
      leased_at = NULL,
      last_error_code = ${errorCode.slice(0, 100)},
      updated_at = now()
    WHERE id = ${job.id}::uuid
      AND status = 'PROCESSING'
      AND leased_at = ${job.leasedAt.toISOString()}::timestamptz
  `);
}
