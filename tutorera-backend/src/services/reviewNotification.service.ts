import { NotificationService } from "./notification.service";

/** A committed review must not be reported as failed because its email or
 * in-app delivery failed. This is best-effort delivery, not a durable outbox. */
export async function publishReviewNotification(...args: Parameters<typeof NotificationService.publishEvent>): Promise<void> {
  try {
    await NotificationService.publishEvent(...args);
  } catch (error) {
    // Do not log recipient details, document reasons, or provider responses.
    console.error("[ReviewNotification] Post-commit delivery failed", {
      event: args[1], errorType: error instanceof Error ? error.name : "UnknownError",
    });
  }
}
