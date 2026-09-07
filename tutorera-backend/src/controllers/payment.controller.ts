// src/controllers/payment.controller.ts
import { Response, Request } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import Bid from "../models/Bid.model";
import RequestModel from "../models/Request.model";
import { paymentProvider, recordPaymentLedger } from "../services/paymentProvider.service";
import { finalizeBidAcceptance } from "./request.controller";
import sendEmail from "../utils/sendEmail";
import { paymentConfirmedEmail, paymentFailedEmail, paymentFailedNotifyTutorEmail } from "../utils/emailTemplates";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

const FRONTEND_URL = process.env.CLIENT_URL as string;

// @desc    Create an authorized payment checkout session for an EXISTING booking.
//          (Retained for any booking that already exists without payment —
//          the primary path now is initiateAcceptBid, which pays BEFORE the
//          booking is created.)
// @route   POST /api/v1/payments/booking/:bookingId/checkout
// @access  Private (student who owns the booking)
export const createBookingCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const isParent = req.user?.role === "parent";
  const booking = isParent
    ? await Booking.findOne({ _id: req.params.bookingId, parent: req.user?._id })
    : await Booking.findOne({ _id: req.params.bookingId, student: req.user?._id });

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  if (booking.paymentStatus === "confirmed") {
    res.status(400).json({ success: false, message: "This booking has already been paid." });
    return;
  }

  const student = await User.findById(isParent ? booking.student : req.user?._id).select("name email phone");
  if (!student) {
    res.status(404).json({ success: false, message: "Student not found" });
    return;
  }

  const payer = isParent ? await User.findById(req.user?._id).select("name email phone") : student;

  const basketId = booking._id.toString();

  try {
    const checkoutUrl = await paymentProvider.createCheckout({
      amount: booking.amount,
      currency: "PKR",
      customerMobileNo: payer?.phone || "03000000000",
      customerEmail: payer?.email || student.email,
      basketId,
      bookingId: booking._id.toString(),
      studentId: booking.student.toString(),
      tutorId: booking.tutor.toString(),
      description: `TUTORERA booking ${basketId}`,
      successUrl: `${FRONTEND_URL}/dashboard?payment=success&booking=${basketId}`,
      failureUrl: `${FRONTEND_URL}/dashboard?payment=failed&booking=${basketId}`,
      checkoutUrl: `${FRONTEND_URL}/dashboard?payment=processing&booking=${basketId}`,
    });

    res.status(200).json({ success: true, checkoutUrl });
  } catch (err: any) {
    logger.error({ requestId: req.id, err }, "Failed to create payment checkout session");
    const statusCode = err?.statusCode || 502;
    res.status(statusCode).json({ success: false, message: "Unable to start payment. Please try again." });
  }
};

// @desc    Receive payment confirmation webhooks from the authorized payment gateway
// @route   POST /api/v1/payments/webhook
// @access  Public (verified via HMAC signature, not auth middleware)
export const handleRapidGatewayWebhook = async (req: Request, res: Response): Promise<void> => {
  const rawBody: Buffer | undefined = (req as any).rawBody;

  if (!rawBody) {
    logger.error({ requestId: (req as any).id }, "Webhook received with no raw body captured");
    res.status(500).json({ success: false });
    return;
  }

  const signature = req.header("X-RapidGateway-Signature");
  const timestamp = req.header("X-RapidGateway-Timestamp");

  const isValid = paymentProvider.verifyWebhookSignature(rawBody, signature, timestamp);
  if (!isValid) {
    logger.warn({ requestId: (req as any).id }, "Rejected payment webhook — invalid or stale signature");
    res.status(401).json({ success: false, message: "Invalid signature" });
    return;
  }

  const event = paymentProvider.normalizeWebhook(req.body as {
    eventId: string;
    eventType: string;
    merchantTransactionId: string; // == our BASKET_ID
    status: string;
    amount: number;
    currency?: string;
  });

  try {
    if (event.eventType === "transaction.completed") {
      if (event.merchantTransactionId.startsWith("BID-")) {
        const bidId = event.merchantTransactionId.slice("BID-".length);
        const io = req.app.get("io");
        await finalizeBidAcceptance(bidId, io);

        const bid = await Bid.findById(bidId);
        if (bid) {
          const request = await RequestModel.findById(bid.request).select("student");
          const student = request ? await User.findById(request.student).select("name email") : null;
          const tutor = await User.findById(bid.tutor).select("name email");
          await recordPaymentLedger({
            providerTransactionId: event.merchantTransactionId,
            providerEventId: event.eventId,
            eventType: "payment.succeeded",
            status: "succeeded",
            amount: event.amount,
            currency: event.currency,
            bidId,
            studentId: request?.student?.toString(),
            tutorId: bid.tutor.toString(),
            metadata: { gatewayStatus: event.status },
          });
          try {
            if (student && tutor) {
              const booking = await Booking.findOne({ bid: bid._id }).populate("request");
              const receipt = paymentConfirmedEmail(student.name, tutor.name, event.amount, {
                bookingId: booking?._id?.toString() || `BID-${bidId}`,
                subject: (booking?.request as any)?.subject,
                schedule: booking?.schedule,
                teachingMode: booking?.teachingMode,
                sessionCount: booking?.sessionCount,
              });
              await sendEmail({ to: student.email, subject: receipt.subject, html: receipt.html, eventType: "payment_successful" });
            }
          } catch (err) {
            logger.error({ err, bidId }, "Failed to send payment receipt email");
          }
        }
      } else {
        const booking = await Booking.findById(event.merchantTransactionId);

        if (!booking) {
          logger.warn({ requestId: (req as any).id, basketId: event.merchantTransactionId }, "Webhook for unknown booking");
          res.status(200).json({ success: true });
          return;
        }

        if (booking.paymentStatus !== "confirmed") {
          booking.paymentStatus = "confirmed";
          booking.paymentNote = `Confirmed via authorized payment gateway (event ${event.eventId})`;
          await booking.save();
        }
        await recordPaymentLedger({
          providerTransactionId: event.merchantTransactionId,
          providerEventId: event.eventId,
          eventType: "payment.succeeded",
          status: "succeeded",
          amount: event.amount,
          currency: event.currency,
          bookingId: booking._id.toString(),
          studentId: booking.student.toString(),
          tutorId: booking.tutor.toString(),
          metadata: { gatewayStatus: event.status },
        });

        try {
          const student = await User.findById(booking.student).select("name email");
          const tutor = await User.findById(booking.tutor).select("name email");
          const populatedBooking = await Booking.findById(booking._id).populate("request");
          if (student && tutor) {
            const receipt = paymentConfirmedEmail(student.name, tutor.name, event.amount, {
              bookingId: booking._id.toString(),
              subject: (populatedBooking?.request as any)?.subject,
              schedule: booking.schedule,
              teachingMode: booking.teachingMode,
              sessionCount: booking.sessionCount,
            });
            await sendEmail({ to: student.email, subject: receipt.subject, html: receipt.html, eventType: "payment_successful" });
          }
        } catch (err) {
          logger.error({ err, bookingId: booking._id }, "Failed to send payment receipt email");
        }
      }
    } else if (event.eventType === "transaction.failed") {
      logger.info({ requestId: (req as any).id, basketId: event.merchantTransactionId }, "Payment gateway reported a failed transaction");

      if (event.merchantTransactionId.startsWith("BID-")) {
        const bidId = event.merchantTransactionId.slice("BID-".length);
        const bid = await Bid.findById(bidId);
        if (bid) {
        const request = await RequestModel.findById(bid.request).select("student subject");
          const student = request ? await User.findById(request.student).select("name email") : null;
          const tutor = await User.findById(bid.tutor).select("name email");
          await recordPaymentLedger({
            providerTransactionId: event.merchantTransactionId,
            providerEventId: event.eventId,
            eventType: "payment.failed",
            status: "failed",
            amount: event.amount,
            currency: event.currency,
            bidId,
            studentId: request?.student?.toString(),
            tutorId: bid.tutor.toString(),
            metadata: { gatewayStatus: event.status },
          });
          const bookingDetails = { bookingId: `BID-${bidId}`, subject: request?.subject };
          try {
            if (student) {
              const failEmail = paymentFailedEmail(student.name, tutor?.name || "the tutor", event.amount, bookingDetails);
              await sendEmail({ to: student.email, subject: failEmail.subject, html: failEmail.html, eventType: "payment_failed" });
              const io = req.app.get("io");
              if (io) {
                await sendNotification(io, student._id.toString(), {
                  title: "Payment Failed",
                  message: "Your payment could not be processed. Please try again or contact support.",
                  type: "general",
                  link: "/dashboard",
                });
              }
            }
            if (tutor) {
              const tutorEmail = paymentFailedNotifyTutorEmail(tutor.name, student?.name || "the student", event.amount, bookingDetails);
              await sendEmail({ to: tutor.email, subject: tutorEmail.subject, html: tutorEmail.html, eventType: "payment_failed_tutor" });
            }
          } catch (err) {
            logger.error({ err, bidId }, "Failed to send payment failure notification");
          }
        }
      } else {
        const booking = await Booking.findById(event.merchantTransactionId);
        if (booking) {
          await recordPaymentLedger({
            providerTransactionId: event.merchantTransactionId,
            providerEventId: event.eventId,
            eventType: "payment.failed",
            status: "failed",
            amount: event.amount,
            currency: event.currency,
            bookingId: booking._id.toString(),
            studentId: booking.student.toString(),
            tutorId: booking.tutor.toString(),
            metadata: { gatewayStatus: event.status },
          });
          const requestDoc = booking.request ? await RequestModel.findById(booking.request).select("subject") : null;
          const bookingDetails = { bookingId: booking._id.toString(), subject: requestDoc?.subject, schedule: booking.schedule, teachingMode: booking.teachingMode, sessionCount: booking.sessionCount };
          const student = await User.findById(booking.student).select("name email");
          const tutor = await User.findById(booking.tutor).select("name email");
          try {
            if (student) {
              const failEmail = paymentFailedEmail(student.name, tutor?.name || "the tutor", event.amount, bookingDetails);
              await sendEmail({ to: student.email, subject: failEmail.subject, html: failEmail.html, eventType: "payment_failed" });
              const io = req.app.get("io");
              if (io) {
                await sendNotification(io, student._id.toString(), {
                  title: "Payment Failed",
                  message: "Your payment could not be processed. Please try again or contact support.",
                  type: "general",
                  link: "/dashboard",
                });
              }
            }
            if (tutor) {
              const tutorEmail = paymentFailedNotifyTutorEmail(tutor.name, student?.name || "the student", event.amount, bookingDetails);
              await sendEmail({ to: tutor.email, subject: tutorEmail.subject, html: tutorEmail.html, eventType: "payment_failed_tutor" });
            }
          } catch (err) {
            logger.error({ err, bookingId: booking._id }, "Failed to send payment failure notification");
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error({ requestId: (req as any).id, err }, "Error processing payment gateway webhook");
    res.status(500).json({ success: false });
  }
};
