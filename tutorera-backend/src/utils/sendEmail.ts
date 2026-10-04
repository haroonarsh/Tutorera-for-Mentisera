import { normalizeEmailEventName } from "./emailEvents";
import { deliverOutboxEmail, enqueueEmail } from "../services/emailOutbox.service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  preheader?: string;
  category?: string;
  userId?: string;
  eventType?: string;
  templateId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/** Persist first; provider delivery is retried by the email-outbox worker. */
const sendEmail = async (options: EmailOptions): Promise<void> => {
  const eventType = normalizeEmailEventName(options.eventType || options.category || inferEventType(options.subject));
  const templateId = options.templateId || inferTemplateId(options.subject);
  const job = await enqueueEmail({ ...options, eventType, templateId });
  // Preserve the existing caller contract while keeping failed work durable.
  await deliverOutboxEmail(job._id.toString());
};

function inferEventType(subject: string): string {
  const normalized = subject.toLowerCase();
  if (normalized.includes("registered") || normalized.includes("welcome")) return "user_registered";
  if (normalized.includes("password") && normalized.includes("reset")) return "password_reset_requested";
  if (normalized.includes("password")) return "password_changed";
  if (normalized.includes("application") || normalized.includes("profile submitted")) return "profile_submitted";
  if (normalized.includes("verification") || normalized.includes("verified")) return "profile_approved";
  if (normalized.includes("offer")) return "offer_updated";
  if (normalized.includes("booking")) return "booking_confirmed";
  if (normalized.includes("payment") && normalized.includes("failed")) return "payment_failed";
  if (normalized.includes("payment") && normalized.includes("confirmed")) return "payment_successful";
  if (normalized.includes("payment")) return "payment_pending";
  if (normalized.includes("payout")) return "tutor_payout_processing";
  if (normalized.includes("review")) return "review_requested";
  if (normalized.includes("support") || normalized.includes("contact")) return "support_ticket_created";
  if (normalized.includes("suspended")) return "account_suspended";
  return "email.generic";
}

function inferTemplateId(subject: string): string {
  return subject.toLowerCase().replace(/tutorera®?/g, "tutorera").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "generic";
}

export default sendEmail;
