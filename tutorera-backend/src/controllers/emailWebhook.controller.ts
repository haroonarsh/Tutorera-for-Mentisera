import { Request, Response } from "express";
import { Resend } from "resend";
import EmailLog, { EmailLogStatus } from "../models/EmailLog.model";

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    message_id?: string;
    subject?: string;
    to?: string[];
    bounce?: { message?: string; type?: string; subType?: string };
  };
};

const resend = new Resend(process.env.RESEND_API_KEY);

const STATUS_BY_EVENT: Record<string, EmailLogStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.failed": "failed",
  "email.complained": "bounced",
  "email.suppressed": "bounced",
};

const TIMESTAMP_BY_STATUS: Partial<Record<EmailLogStatus, string>> = {
  sent: "sentAt",
  delivered: "deliveredAt",
  opened: "openedAt",
  bounced: "failedAt",
  failed: "failedAt",
};

// @desc    Receive Resend transactional-email webhooks
// @route   POST /api/v1/webhooks/resend
// @access  Public, verified by Resend/Svix signature when RESEND_WEBHOOK_SECRET is set
export const handleResendWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payloadText = Buffer.isBuffer((req as any).rawBody)
      ? (req as any).rawBody.toString("utf8")
      : JSON.stringify(req.body || {});

    const payload = verifyResendPayload(req, payloadText);
    const status = STATUS_BY_EVENT[payload.type];
    if (!status) {
      res.status(200).json({ success: true, ignored: true, eventType: payload.type });
      return;
    }

    const providerMessageId = payload.data?.email_id || payload.data?.message_id;
    if (!providerMessageId) {
      res.status(202).json({ success: true, message: "Webhook accepted without email identifier" });
      return;
    }

    const eventId = req.header("svix-id") || `${payload.type}:${providerMessageId}:${payload.created_at || Date.now()}`;
    const eventAt = payload.created_at ? new Date(payload.created_at) : new Date();
    const timestampField = TIMESTAMP_BY_STATUS[status];
    const bounceReason = payload.data?.bounce?.message || payload.data?.bounce?.subType || payload.data?.bounce?.type;

    const setUpdate: Record<string, unknown> = {
      status,
      providerMessageId,
    };
    if (timestampField) setUpdate[timestampField] = eventAt;
    if (bounceReason) setUpdate.bounceReason = bounceReason;
    const update = {
      $set: setUpdate,
      $addToSet: { webhookEventIds: eventId },
    };

    const log = await EmailLog.findOneAndUpdate(
      {
        providerMessageId,
        webhookEventIds: { $ne: eventId },
      },
      update,
      { new: true }
    );

    if (!log) {
      const fallback = await EmailLog.findOneAndUpdate(
        {
          recipientEmail: { $in: (payload.data?.to || []).map(email => email.toLowerCase()) },
          subject: payload.data?.subject,
          webhookEventIds: { $ne: eventId },
        },
        update,
        { new: true, sort: { createdAt: -1 } }
      );

      res.status(200).json({
        success: true,
        matched: Boolean(fallback),
        deduplicated: !fallback,
        status,
      });
      return;
    }

    res.status(200).json({ success: true, matched: true, status });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || "Invalid Resend webhook" });
  }
};

function verifyResendPayload(req: Request, payloadText: string): ResendWebhookPayload {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return JSON.parse(payloadText) as ResendWebhookPayload;
  }

  const id = req.header("svix-id");
  const timestamp = req.header("svix-timestamp");
  const signature = req.header("svix-signature");
  if (!id || !timestamp || !signature) {
    throw new Error("Missing Resend webhook signature headers");
  }

  return resend.webhooks.verify({
    payload: payloadText,
    headers: { id, timestamp, signature },
    webhookSecret,
  }) as ResendWebhookPayload;
}
