// src/controllers/payment.controller.ts
import { Response, Request } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import { createTransaction, verifyWebhookSignature } from "../utils/rapidGateway";
import logger from "../config/logger";

const FRONTEND_URL = process.env.CLIENT_URL as string;

// @desc    Create a Rapid Gateway checkout session for a booking
// @route   POST /api/v1/payments/booking/:bookingId/checkout
// @access  Private (student who owns the booking)
export const createBookingCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    student: req.user?._id,
  });

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  if (booking.paymentStatus === "confirmed") {
    res.status(400).json({ success: false, message: "This booking has already been paid." });
    return;
  }

  const student = await User.findById(req.user?._id).select("name email phone");
  if (!student) {
    res.status(404).json({ success: false, message: "Student not found" });
    return;
  }

  // BASKET_ID is the field Rapid Gateway echoes back in every webhook as
  // merchantTransactionId — using the booking's own _id means reconciling a
  // webhook to a booking needs no extra field or lookup table.
  const basketId = booking._id.toString();

  try {
    const checkoutUrl = await createTransaction({
      amount: booking.amount,
      customerMobileNo: student.phone || "03000000000",
      customerEmail: student.email,
      basketId,
      description: `TUTORERA booking ${basketId}`,
      successUrl: `${FRONTEND_URL}/dashboard?payment=success&booking=${basketId}`,
      failureUrl: `${FRONTEND_URL}/dashboard?payment=failed&booking=${basketId}`,
      checkoutUrl: `${FRONTEND_URL}/dashboard?payment=processing&booking=${basketId}`,
    });

    res.status(200).json({ success: true, checkoutUrl });
  } catch (err: any) {
    logger.error({ requestId: req.id, err }, "Failed to create Rapid Gateway checkout session");
    const statusCode = err?.statusCode || 502;
    res.status(statusCode).json({ success: false, message: "Unable to start payment. Please try again." });
  }
};

// @desc    Receive payment confirmation webhooks from Rapid Gateway
// @route   POST /api/v1/payments/webhook
// @access  Public (verified via HMAC signature, not auth middleware)
export const handleRapidGatewayWebhook = async (req: Request, res: Response): Promise<void> => {
  const rawBody: Buffer | undefined = (req as any).rawBody;

  if (!rawBody) {
    // Should never happen if app.ts's express.json({verify}) is wired correctly.
    logger.error({ requestId: (req as any).id }, "Webhook received with no raw body captured");
    res.status(500).json({ success: false });
    return;
  }

  const signature = req.header("X-RapidGateway-Signature");
  const timestamp = req.header("X-RapidGateway-Timestamp");

  const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!isValid) {
    logger.warn({ requestId: (req as any).id }, "Rejected Rapid Gateway webhook — invalid or stale signature");
    res.status(401).json({ success: false, message: "Invalid signature" });
    return;
  }

  const event = req.body as {
    eventId: string;
    eventType: string;
    merchantTransactionId: string; // == our BASKET_ID == booking._id
    status: string;
    amount: number;
  };

  // Respond fast per their docs ("respond with 2xx quickly; anything else
  // counts as a failed delivery attempt and gets retried"). We do the DB
  // update inline here since it's a single fast write, not a slow job.
  try {
    if (event.eventType === "transaction.completed") {
      const booking = await Booking.findById(event.merchantTransactionId);

      if (!booking) {
        logger.warn({ requestId: (req as any).id, basketId: event.merchantTransactionId }, "Webhook for unknown booking");
        res.status(200).json({ success: true }); // acknowledge anyway — retrying won't help if the booking doesn't exist
        return;
      }

      // Idempotent: if we've already marked this confirmed (e.g. a retried
      // or duplicate webhook delivery — their docs explicitly warn delivery
      // is at-least-once), don't reprocess.
      if (booking.paymentStatus !== "confirmed") {
        booking.paymentStatus = "confirmed";
        booking.paymentNote = `Confirmed via Rapid Gateway (event ${event.eventId})`;
        await booking.save();
      }
    } else if (event.eventType === "transaction.failed") {
      logger.info({ requestId: (req as any).id, basketId: event.merchantTransactionId }, "Rapid Gateway reported a failed transaction");
      // paymentStatus stays "pending" — the student can retry checkout.
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error({ requestId: (req as any).id, err }, "Error processing Rapid Gateway webhook");
    res.status(500).json({ success: false });
  }
};