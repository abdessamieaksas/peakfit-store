import "server-only";

import { NotificationDeliveryError } from "@/features/notifications/domain/notification";
import {
  claimNotificationJobs,
  markNotificationFailed,
  markNotificationSent,
  releaseUnconfiguredNotification,
} from "@/features/notifications/server/notification-repository";
import { deliverNotification } from "@/features/notifications/server/providers";

export type DispatchSummary = {
  claimed: number;
  sent: number;
  deferred: number;
  failed: number;
};

export async function dispatchNotifications(options?: {
  limit?: number;
  orderReference?: string;
}): Promise<DispatchSummary> {
  const jobs = await claimNotificationJobs(
    options?.limit ?? 10,
    options?.orderReference,
  );
  const summary: DispatchSummary = {
    claimed: jobs.length,
    sent: 0,
    deferred: 0,
    failed: 0,
  };

  await Promise.all(
    jobs.map(async (job) => {
      try {
        const delivery = await deliverNotification(job);
        await markNotificationSent(job, delivery.providerMessageId);
        summary.sent += 1;
      } catch (error) {
        if (
          error instanceof NotificationDeliveryError &&
          error.code === "CHANNEL_NOT_CONFIGURED"
        ) {
          await releaseUnconfiguredNotification(job);
          summary.deferred += 1;
          return;
        }

        const deliveryError =
          error instanceof NotificationDeliveryError
            ? error
            : new NotificationDeliveryError(
                "UNEXPECTED_PROVIDER_ERROR",
                true,
                "Unexpected notification provider error.",
                { cause: error },
              );
        await markNotificationFailed(
          job,
          deliveryError.code,
          deliveryError.retryable,
        );
        summary.failed += 1;
      }
    }),
  );

  return summary;
}
