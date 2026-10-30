import crypto from "crypto";
import { Request, Response } from "express";
import logger from "../config/logger";
import { paymentProvider, recordPaymentLedger } from "../services/paymentProvider.service";
import PaymentLedger from "../models/PaymentLedger.model";
import Booking from "../models/Booking.model";
import { finalizeBidAcceptance } from "../controllers/request.controller";
import { finalizePromoRedemption, getAppliedPromoForBasket } from "../services/promoCode.service";

// RapidPay webhook handler.
//
// Register the webhook endpoint in RapidPay's merchant dashboard as:
//   https://tutorera.ac.pk/api/payments/rapidpay/webhook
//
// Set RAPIDPAY_WEBHOOK_SECRET in your deployment environment (Render / Cloudflare).
// Never commit the secret to source.
//
// CONFIRM_WITH_DOCS: RapidPay's signing scheme (header name, algorithm, signed
// payload shape) is assumed to be HMAC-SHA256 of the raw body, delivered in an
// X-RapidPay-Signature header. Verify against merchant documentation and update
// verifyWebhookSignature() and extractWebhookPayload() accordingly before
// enabling this in production.

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    // Perform a dummy compare to avoid timing leaks on length mismatch.
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// CONFIRM_WITH_DOCS: update the header name and signing scheme to match
// RapidPay's actual webhook documentation.
function verifyWebhookSignature(rawBody: Buffer, providedSignature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(providedSignature, expected);
}

interface RapidPayWebhookPayload {
  event: string;              // e.g. "payment.success", "payment.failed" — CONFIRM_WITH_DOCS
  sessionId?: string;         // CONFIRM_WITH_DOCS: may differ in real API
  reference?: string;         // Our basket ID (BID-... or booking mongo id)
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

// CONFIRM_WITH_DOCS: replace field names with real RapidPay webhook body fields.
function extractWebhookPayload(body: unknown): RapidPayWebhookPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  return {
    event: String(b.event || b.type || b.eventType || ""),
    sessionId: b.sessionId as string | undefined ?? b.id as string | undefined ?? b.transactionId as string | undefined,
    reference: b.reference as string | undefined ?? b.basketId as string | undefined ?? b.billReferenceNo as string | undefined,
    amount: typeof b.amount === "number" ? b.amount : undefined,
    currency: typeof b.currency === "string" ? b.currency : undefined,
    status: typeof b.status === "string" ? b.status : undefined,
    ...b,
  };
}

/**
 * POST /api/payments/rapidpay/webhook
 *
 * Receives push notifications from RapidPay. Verifies HMAC signature, then
 * finalizes or rejects the corresponding booking. Safe to call more than once:
 * finalizeBidAcceptance's atomic guard makes duplicate events a no-op.
 */
export const handleRapidPayWebhook = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.RAPIDPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logger.error("RAPIDPAY_WEBHOOK_SECRET is not configured — webhook cannot be verified");
    res.status(503).json({ success: false, message: "Webhook verification is not configured." });
    return;
  }

  // CONFIRM_WITH_DOCS: update the header name to match RapidPay's docs.
  const providedSignature = (req.headers["x-rapidpay-signature"] || req.headers["x-webhook-signature"] || "") as string;
  const rawBody: Buffer | undefined = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody || !providedSignature) {
    res.status(400).json({ success: false, message: "Missing signature or body." });
    return;
  }

  if (!verifyWebhookSignature(rawBody, providedSignature, secret)) {
    logger.warn({ headers: req.headers }, "Rejected RapidPay webhook with invalid signature");
    res.status(401).json({ success: false, message: "Invalid webhook signature." });
    return;
  }

  const payload = extractWebhookPayload(req.body);
  if (!payload) {
    res.status(400).json({ success: false, message: "Unreadable webhook payload." });
    return;
  }

  const { event, sessionId, reference: basketId, amount, currency } = payload;
  const requestId = (req as Request & { id?: string }).id;

  logger.info({ requestId, event, basketId, sessionId }, "Received verified RapidPay webhook");

  // Acknowledge immediately — RapidPay may retry if we take too long.
  res.status(200).json({ success: true, received: true });

  // Async finalization after the 200 is sent.
  setImmediate(async () => {
    try {
      const isSuccess = /success/i.test(event) || /success/i.test(payload.status as string || "");
      const isFailure = /fail/i.test(event) || /fail/i.test(payload.status as string || "");

      if (!basketId) {
        logger.warn({ requestId, event, sessionId }, "RapidPay webhook has no basket reference — cannot reconcile");
        return;
      }

      const checkout = await PaymentLedger.findOne({
        provider: "rapidpay",
        providerTransactionId: basketId,
        eventType: "checkout.created",
      }).sort("-createdAt");

      if (!checkout) {
        logger.warn({ requestId, basketId, event }, "RapidPay webhook: no checkout ledger row found for this reference");
        return;
      }

      const alreadySettled = await PaymentLedger.exists({
        provider: "rapidpay",
        providerTransactionId: basketId,
        eventType: "payment.succeeded",
        status: "succeeded",
      });
      if (alreadySettled) {
        logger.info({ requestId, basketId }, "RapidPay webhook: payment already settled — ignoring duplicate event");
        return;
      }

      if (isSuccess) {
        const expectedAmount = checkout.grossAmount;
        const expectedCurrency = (checkout.currency || "USD").toUpperCase();
        const receivedAmount = amount ?? expectedAmount;
        const receivedCurrency = (currency || expectedCurrency).toUpperCase();

        if (receivedAmount !== expectedAmount || receivedCurrency !== expectedCurrency) {
          logger.error(
            { requestId, basketId, expectedAmount, receivedAmount, expectedCurrency, receivedCurrency },
            "RapidPay webhook amount or currency mismatch — refusing to finalize"
          );
          return;
        }

        if (basketId.startsWith("BID-")) {
          const bidId = basketId.slice("BID-".length);
          const io = req.app.get("io");
          await finalizeBidAcceptance(bidId, io);
          const appliedPromo = await getAppliedPromoForBasket(basketId);
          await recordPaymentLedger({
            providerTransactionId: basketId,
            eventType: "payment.succeeded",
            status: "succeeded",
            amount: receivedAmount,
            currency: receivedCurrency,
            bidId,
            studentId: checkout.student?.toString(),
            tutorId: checkout.tutor?.toString(),
            metadata: { sessionId, event, webhookSource: "rapidpay" },
          });
          if (appliedPromo && checkout.student) {
            await finalizePromoRedemption(
              appliedPromo.promoCodeId,
              checkout.student.toString(),
              basketId,
              appliedPromo.originalAmount,
              appliedPromo.discountAmount,
            ).catch((err) => logger.error({ err, basketId }, "Failed to record promo redemption via webhook"));
          }
          logger.info({ requestId, basketId, bidId }, "RapidPay webhook: bid-backed payment confirmed and booking created");
        } else {
          const booking = await Booking.findById(basketId);
          if (!booking) {
            logger.warn({ requestId, basketId }, "RapidPay webhook: no booking found for this reference");
            return;
          }
          if (booking.paymentStatus !== "confirmed") {
            booking.paymentStatus = "confirmed";
            booking.paymentNote = "Confirmed via RapidPay webhook";
            await booking.save();
          }
          await recordPaymentLedger({
            providerTransactionId: basketId,
            eventType: "payment.succeeded",
            status: "succeeded",
            amount: receivedAmount,
            currency: receivedCurrency,
            bookingId: basketId,
            studentId: checkout.student?.toString(),
            tutorId: checkout.tutor?.toString(),
            metadata: { sessionId, event, webhookSource: "rapidpay" },
          });
          logger.info({ requestId, basketId }, "RapidPay webhook: booking payment confirmed");
        }
      } else if (isFailure) {
        await PaymentLedger.updateOne(
          { _id: checkout._id, status: "pending" },
          { $set: { status: "failed", "metadata.webhookEvent": event } }
        );
        await recordPaymentLedger({
          providerTransactionId: basketId,
          eventType: "payment.failed",
          status: "failed",
          amount: checkout.grossAmount,
          currency: checkout.currency,
          bookingId: checkout.booking?.toString(),
          bidId: checkout.bid?.toString(),
          studentId: checkout.student?.toString(),
          tutorId: checkout.tutor?.toString(),
          metadata: { sessionId, event, webhookSource: "rapidpay" },
        });
        logger.info({ requestId, basketId, event }, "RapidPay webhook: payment failure recorded");
      } else {
        logger.info({ requestId, basketId, event }, "RapidPay webhook: unhandled event type — acknowledged but not acted on");
      }
    } catch (err) {
      logger.error({ err, basketId, event }, "RapidPay webhook: unhandled error during async finalization");
    }
  });
};
