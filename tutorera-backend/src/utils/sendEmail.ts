import { Resend } from "resend";
import { renderBrandedEmail } from "./emailBrand";
import EmailLog from "../models/EmailLog.model";

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
  retryCount?: number;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const eventType = options.eventType || options.category || inferEventType(options.subject);
  const templateId = options.templateId || inferTemplateId(options.subject);
  const log = await EmailLog.create({
    user: options.userId,
    eventType,
    templateId,
    recipientEmail: options.to,
    subject: options.subject,
    relatedEntityType: options.relatedEntityType,
    relatedEntityId: options.relatedEntityId,
    status: "queued",
    queuedAt: new Date(),
    retryCount: options.retryCount || 0,
  });

  try {
    const result = await resend.emails.send({
      from: "TUTORERA® <noreply@tutorera.ac.pk>",
      to: options.to,
      subject: options.subject,
      html: renderBrandedEmail({
        subject: options.subject,
        html: options.html,
        preheader: options.preheader,
        category: options.category || eventType,
      }),
    });

    if (result.error) {
      await EmailLog.findByIdAndUpdate(log._id, {
        status: "failed",
        failedAt: new Date(),
        bounceReason: result.error.message,
      });
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    await EmailLog.findByIdAndUpdate(log._id, {
      status: "sent",
      sentAt: new Date(),
      providerMessageId: result.data?.id,
    });
  } catch (error: any) {
    await EmailLog.findByIdAndUpdate(log._id, {
      status: "failed",
      failedAt: new Date(),
      bounceReason: error?.message || "Unknown email provider error",
    });
    throw error;
  }
};

function inferEventType(subject: string): string {
  const normalized = subject.toLowerCase();
  if (normalized.includes("registered") || normalized.includes("welcome")) return "auth.user.registered";
  if (normalized.includes("password") && normalized.includes("reset")) return "auth.password.reset_requested";
  if (normalized.includes("password")) return "auth.password.changed";
  if (normalized.includes("application") || normalized.includes("profile submitted")) return "tutor.profile.submitted";
  if (normalized.includes("verification") || normalized.includes("verified")) return "tutor.verification.approved";
  if (normalized.includes("offer")) return "offer.updated";
  if (normalized.includes("booking")) return "booking.confirmed";
  if (normalized.includes("payment") && normalized.includes("failed")) return "payment.failed";
  if (normalized.includes("payment") && normalized.includes("confirmed")) return "payment.succeeded";
  if (normalized.includes("payment")) return "payment.pending";
  if (normalized.includes("payout") && normalized.includes("failed")) return "payout.failed";
  if (normalized.includes("payout")) return "payout.processing";
  if (normalized.includes("review")) return "review.requested";
  if (normalized.includes("support") || normalized.includes("contact")) return "support.ticket.created";
  if (normalized.includes("suspended")) return "account.suspended";
  return "email.generic";
}

function inferTemplateId(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/tutorera®?/g, "tutorera")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "generic";
}

export default sendEmail;
