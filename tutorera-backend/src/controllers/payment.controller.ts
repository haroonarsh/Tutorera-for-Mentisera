// src/controllers/payment.controller.ts
import { Response, Request } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import Bid from "../models/Bid.model";
import RequestModel from "../models/Request.model";
import ParentProfile from "../models/ParentProfile.model";
import PaymentLedger from "../models/PaymentLedger.model";
import { paymentProvider, recordPaymentLedger } from "../services/paymentProvider.service";
import { finalizeBidAcceptance } from "./request.controller";
import { NotificationService } from "../services/notification.service";
import logger from "../config/logger";
import { calculateMarketplaceFees } from "../services/pricing.service";
import { assertAcceptanceAvailable } from "../services/market.service";
import { getAppliedPromoForBasket, previewPromoDiscount, finalizePromoRedemption, PromoCodeError } from "../services/promoCode.service";

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

  try {
    await assertAcceptanceAvailable(booking.countryCode);
  } catch (marketError: any) {
    res.status(marketError.statusCode || 409).json({
      success: false,
      code: marketError.code || "MARKET_DISCOVERY_ONLY",
      message: marketError.message,
      market: booking.countryCode,
    });
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
    let appliedPromo: { promoCodeId: string; code: string; discountAmount: number } | undefined;
    const originalStudentTotal = booking.studentTotal || booking.amount;
    const promoCodeInput = req.body?.promoCode;
    if (promoCodeInput) {
      appliedPromo = await previewPromoDiscount(booking.student.toString(), req.user?.role, promoCodeInput, originalStudentTotal);
      // Persist the discount straight onto the booking - unlike the
      // bid-acceptance flow, this booking already exists, so there's no
      // separate finalization step to apply it to later.
      booking.studentFee = Math.max(0, (booking.studentFee || 0) - appliedPromo.discountAmount);
      booking.studentTotal = booking.subtotal + booking.studentFee;
      await booking.save();
    }

    // This booking's commission/tax were already fixed at creation time, but
    // gateway fee depends on the amount actually charged right now (which a
    // promo discount above may have just changed) - look up the current
    // active gateway rate and compute it fresh rather than assuming 0.
    const currentFeeConfig = await calculateMarketplaceFees(booking.subtotal, { currency: booking.currency, countryCode: booking.countryCode });
    const gatewayFee = Math.round(
      (booking.studentTotal || booking.amount) * currentFeeConfig.feeConfig.gatewayFeePercent / 100 + currentFeeConfig.feeConfig.gatewayFixedFee
    );

    const checkoutUrl = await paymentProvider.createCheckout({
      amount: booking.studentTotal || booking.amount,
      currency: booking.currency || "PKR",
      customerMobileNo: payer?.phone || "03000000000",
      customerEmail: payer?.email || student.email,
      basketId,
      bookingId: booking._id.toString(),
      studentId: booking.student.toString(),
      tutorId: booking.tutor.toString(),
      feeSnapshot: {
        subtotal: booking.subtotal,
        studentFee: booking.studentFee,
        tutorFee: booking.tutorFee,
        tax: booking.tax,
        studentTotal: booking.studentTotal,
        tutorNet: booking.tutorNet,
        platformFee: booking.platformFee,
        gatewayFee,
        feeConfig: booking.feeConfig,
      },
      description: `TUTORERA booking ${basketId}`,
      successUrl: `${FRONTEND_URL}/dashboard?payment=success&booking=${basketId}`,
      failureUrl: `${FRONTEND_URL}/dashboard?payment=failed&booking=${basketId}`,
      checkoutUrl: `${FRONTEND_URL}/dashboard?payment=processing&booking=${basketId}`,
      ...(appliedPromo && { metadata: { appliedPromo: { ...appliedPromo, originalAmount: originalStudentTotal } } }),
    });

    res.status(200).json({ success: true, checkoutUrl });
  } catch (err: any) {
    if (err instanceof PromoCodeError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    logger.error({ requestId: req.id, err }, "Failed to create payment checkout session");
    const statusCode = err?.statusCode || 502;
    res.status(statusCode).json({ success: false, message: "Unable to start payment. Please try again." });
  }
};

// @desc    Get student's transaction history
// @route   GET /api/payments/history
// @access  Private (student or parent)
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, page = "1" } = req.query;
  const limitNum = 20;
  const skip = (Number(page) - 1) * limitNum;

  const parentBookingIds = req.user?.role === "parent"
    ? await Booking.find({ parent: req.user._id }).distinct("_id")
    : [];
  const ledgerFilter: Record<string, unknown> = req.user?.role === "parent"
    ? { $or: [{ student: req.user._id }, { booking: { $in: parentBookingIds } }] }
    : { student: req.user?._id };
  if (status) ledgerFilter.status = status;

  const [transactions, total] = await Promise.all([
    PaymentLedger.find(ledgerFilter)
      .populate<{ booking: { schedule?: string; teachingMode?: string; status?: string } }>("booking", "schedule teachingMode status")
      .populate<{ tutor: { name: string } }>("tutor", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PaymentLedger.countDocuments(ledgerFilter),
  ]);

  const bookingIds = transactions
    .map((t) => (t.booking as unknown as { _id: { toString: () => string } })?._id?.toString())
    .filter(Boolean);

  const bookings = bookingIds.length
    ? await Booking.find({ _id: { $in: bookingIds } }).select("student tutor request pricingUnit sessionCount").populate("request", "subject").lean()
    : [];

  const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));

  const enriched = transactions.map((t) => {
    const booking = t.booking as unknown as { _id: { toString: () => string }; schedule?: string; teachingMode?: string; status?: string };
    const bookingData = booking?._id ? bookingMap.get(booking._id.toString()) : null;
    const eventLabels: Record<string, string> = {
      "payment.succeeded": "Payment Received",
      "payment.refunded": "Refund Processed",
      "payment.failed": "Payment Failed",
      "checkout.created": "Checkout Initiated",
    };
    return {
      _id: t._id,
      type: t.eventType,
      typeLabel: eventLabels[t.eventType] || t.eventType,
      status: t.status,
      amount: t.grossAmount,
      currency: t.currency,
      refundAmount: t.refundAmount,
      createdAt: t.createdAt,
      booking: bookingData
        ? {
            id: (booking._id as unknown as { toString: () => string }).toString(),
            subject: (bookingData.request as unknown as { subject?: string })?.subject || "Tutoring",
            schedule: booking?.schedule || "",
            teachingMode: booking?.teachingMode || "online",
            bookingStatus: booking?.status || "",
            sessionCount: bookingData.sessionCount || 1,
            tutorName: t.tutor ? (t.tutor as unknown as { name: string }).name : "Tutor",
          }
        : null,
      providerTransactionId: t.providerTransactionId,
    };
  });

  res.status(200).json({
    success: true,
    transactions: enriched,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limitNum) },
  });
};

// @desc    Confirm a Swich payment session's real outcome, server-side.
//          Called by the frontend when the customer returns to
//          successURL/failedURL — Swich's Payment Session product has no
//          push webhook, so THIS endpoint (not a webhook route) is what
//          actually finalizes the booking. Safe to call more than once:
//          finalizeBidAcceptance's own atomic guard (status:
//          "payment_pending" -> "accepted") already makes a second call a
//          no-op, exactly as it did for the old webhook-driven flow.
// @route   POST /api/v1/payments/swich/confirm
// @access  Private (student who initiated the checkout)
export const confirmSwichPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { basketId } = req.body as { basketId?: string };

  if (!basketId) {
    res.status(400).json({ success: false, message: "basketId is required" });
    return;
  }

  try {
    const result = await paymentProvider.confirmCheckout(basketId);

    if (!result.confirmed) {
      // Still pending, failed, expired, or cancelled — not an error, just
      // not a success yet. The frontend decides what to show/do next
      // (e.g. keep polling if sessionStatus is "Pending").
      res.status(200).json({ success: true, confirmed: false, sessionStatus: result.sessionStatus });
      return;
    }

    if (basketId.startsWith("BID-")) {
      const bidId = basketId.slice("BID-".length);
      const bid = await Bid.findById(bidId);

      if (!bid) {
        res.status(404).json({ success: false, message: "Offer not found for this payment" });
        return;
      }

      // Same amount/currency integrity check the old webhook handler did
      // before ever finalizing — kept identical on purpose, this isn't
      // Swich-specific, it's a fraud/tampering guard that still applies.
      const request = await RequestModel.findById(bid.request).select("student currency countryCode teachingMode");
      const isRequestOwner = request?.student?.toString() === req.user?._id?.toString();
      const isLinkedParent = !isRequestOwner && req.user?.role === "parent" && request
        ? Boolean(await ParentProfile.exists({ user: req.user._id, "children.studentUser": request.student }))
        : false;
      if (!isRequestOwner && !isLinkedParent) {
        res.status(403).json({ success: false, message: "You are not authorized to confirm this payment." });
        return;
      }
      const appliedPromo = await getAppliedPromoForBasket(basketId);
      const baseExpectedAmount = (await calculateMarketplaceFees(bid.amount, {
        currency: bid.currency || request?.currency,
        countryCode: request?.countryCode,
        teachingMode: request?.teachingMode as "online" | "in-person" | "both" | undefined,
      })).studentTotal;
      const expectedAmount = appliedPromo
        ? Math.round((baseExpectedAmount - appliedPromo.discountAmount) * 100) / 100
        : baseExpectedAmount;
      const expectedCurrency = (bid.currency || request?.currency || "PKR").toUpperCase();

      if (!request || result.amount !== expectedAmount || result.currency.toUpperCase() !== expectedCurrency) {
        logger.error({ requestId: req.id, bidId, expectedAmount, receivedAmount: result.amount, expectedCurrency, receivedCurrency: result.currency }, "Swich payment confirm amount or currency did not match the accepted offer");
        res.status(422).json({ success: false, message: "Payment amount or currency mismatch" });
        return;
      }

      const io = req.app.get("io");
      await finalizeBidAcceptance(bidId, io);

      await recordPaymentLedger({
        providerTransactionId: basketId,
        eventType: "payment.succeeded",
        status: "succeeded",
        amount: result.amount,
        currency: result.currency,
        bidId,
        studentId: request.student.toString(),
        tutorId: bid.tutor.toString(),
        metadata: { sessionStatus: result.sessionStatus },
      });

      res.status(200).json({ success: true, confirmed: true });
      return;
    }

    // Non-BID basketId means an existing-booking checkout
    // (createBookingCheckout's path) rather than an accept-offer flow.
    const booking = await Booking.findById(basketId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found for this payment" });
      return;
    }
    const isBookingOwner = booking.student.toString() === req.user?._id?.toString()
      || booking.parent?.toString() === req.user?._id?.toString();
    if (!isBookingOwner) {
      res.status(403).json({ success: false, message: "You are not authorized to confirm this payment." });
      return;
    }

    const expectedAmount = booking.studentTotal || booking.amount;
    const expectedCurrency = (booking.currency || "PKR").toUpperCase();
    if (result.amount !== expectedAmount || result.currency.toUpperCase() !== expectedCurrency) {
      logger.error({ requestId: req.id, bookingId: booking._id, expectedAmount, receivedAmount: result.amount, expectedCurrency, receivedCurrency: result.currency }, "Swich payment confirm amount or currency did not match the booking");
      res.status(422).json({ success: false, message: "Payment amount or currency mismatch" });
      return;
    }

    if (booking.paymentStatus !== "confirmed") {
      booking.paymentStatus = "confirmed";
      booking.paymentNote = "Confirmed via Swich payment session status check";
      await booking.save();

      const appliedPromo = await getAppliedPromoForBasket(basketId);
      if (appliedPromo) {
        await finalizePromoRedemption(appliedPromo.promoCodeId, booking.student.toString(), booking._id.toString(), appliedPromo.originalAmount, appliedPromo.discountAmount).catch((err) =>
          logger.error({ err, bookingId: booking._id }, "Failed to record promo code redemption for booking checkout")
        );
      }
    }

    await recordPaymentLedger({
      providerTransactionId: basketId,
      eventType: "payment.succeeded",
      status: "succeeded",
      amount: result.amount,
      currency: result.currency,
      bookingId: booking._id.toString(),
      studentId: booking.student.toString(),
      tutorId: booking.tutor.toString(),
      metadata: { sessionStatus: result.sessionStatus },
    });

    res.status(200).json({ success: true, confirmed: true });
  } catch (err: any) {
    logger.error({ requestId: req.id, err, basketId }, "Failed to confirm Swich payment");
    const statusCode = err?.statusCode || 500;
    res.status(statusCode).json({ success: false, message: "Unable to confirm payment. Please try again." });
  }
};
