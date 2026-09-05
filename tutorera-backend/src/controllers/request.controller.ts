import mongoose, { Types } from "mongoose";
import { Response } from "express";
import { Request as ExpressRequest } from "express"; 
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import { sendNotification } from "../utils/socket";
import { calculateMarketplaceFees } from "../config/constants";
import OfferNegotiation from "../models/OfferNegotiation.model";
import { containsContactInfo } from "../utils/contentFilter";
import { logAudit } from "../utils/logAudit";
import { incrementBidCount } from "../middlewares/bidLimit.middleware";
import BookedSlot from "../models/BookedSlot.model";
import sendEmail from "../utils/sendEmail";
import { bookingConfirmedEmail, bidAcceptedEmail, newBidEmail, directBookingRequestEmail, directBookingAcceptedEmail, directBookingDeclinedEmail, adminNewTuitionRequestEmail } from "../utils/emailTemplates";
import { convertToPKR } from "../config/countries";
import { createTransaction } from "../utils/rapidGateway";
import AbandonedJourney from "../models/AbandonedJourney.model";

// ─── Plan Limits ───────────────────────────────────────────────────────────────
const PLAN_BID_LIMITS: Record<string, number> = { free: 3, standard: 10, premium: -1 };
const PLAN_REQUEST_LIMITS: Record<string, number> = { free: 2, standard: 10, premium: -1 };

// Returns true if the stored reset date is from a previous calendar month
function isNewMonth(resetDate: Date): boolean {
  const now = new Date();
  return (
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()
  );
}

// @desc    Create tuition request
// @route   POST /api/requests
// @access  Private (student)
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  // ── Reset monthly count if new month has started ──
  const resetDate = (user as any).requestsResetDate as Date | undefined;
  if (!resetDate || isNewMonth(resetDate)) {
    (user as any).requestsThisMonth = 0;
    (user as any).requestsResetDate = new Date();
    await user.save();
  }

  // ── Enforce plan limit ──
  const limit = PLAN_REQUEST_LIMITS[user.plan || "free"];
  const used = (user as any).requestsThisMonth || 0;

  if (limit !== -1 && used >= limit) {
    const planNames: Record<string, string> = { free: "Free", standard: "Standard", premium: "Premium" };
    res.status(403).json({
      success: false,
      code: "REQUEST_LIMIT_REACHED",
      message: `You've used all ${limit} tuition requests included in your ${planNames[user.plan || "free"]} plan this month. Upgrade your plan to post more requests.`,
    });
    return;
  }

  // ── Create request ──
  const request = await Request.create({ student: req.user?._id, ...req.body });
  await AbandonedJourney.updateMany(
    { user: req.user?._id, type: "student_request", completedAt: { $exists: false } },
    { $set: { completedAt: new Date() } }
  );

  // ── Increment monthly counter ──
  await User.findByIdAndUpdate(req.user?._id, {
    $inc: { requestsThisMonth: 1 },
  });

  // Notify a bounded set of relevant approved tutors, respecting global vs local location constraints
  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const matchFilter: Record<string, unknown> = { verificationStatus: "approved", subjects: request.subject, levels: request.level };
  
  if (request.teachingMode === "online") {
    // Online requests match tutors globally who offer online tutoring
    matchFilter.teachingMode = { $in: ["online", "both"] };
    if (request.preferredTutorCountries && request.preferredTutorCountries.length > 0) {
      matchFilter.countryCode = { $in: request.preferredTutorCountries };
    }
  } else if (request.teachingMode === "in-person") {
    // Home tuition strictly matches tutors in the same country & city who offer in-person tutoring
    matchFilter.teachingMode = { $in: ["in-person", "both"] };
    if (request.countryCode) {
      matchFilter.countryCode = request.countryCode;
    }
    if (request.city) {
      matchFilter.city = new RegExp(`^${request.city.trim()}$`, "i");
    }
  } else {
    // "both" mode: match either online global tutors OR local in-person tutors
    matchFilter.$or = [
      { teachingMode: { $in: ["online", "both"] } },
      {
        teachingMode: { $in: ["in-person", "both"] },
        ...(request.countryCode ? { countryCode: request.countryCode } : {}),
        ...(request.city ? { city: new RegExp(`^${request.city.trim()}$`, "i") } : {}),
      },
    ];
  }

  const currencySymbol = request.currency || "PKR";
  const matchingTutors = await TutorProfile.find(matchFilter).select("user").limit(30).lean();
  await Promise.all(matchingTutors.map(profile => sendNotification(req.app.get("io"), profile.user.toString(), {
    title: "Matching Tuition Request",
    message: `${request.subject} · ${request.level} · Proposed ${currencySymbol} ${request.budget.toLocaleString()}/${request.pricingUnit} (${request.teachingMode === "online" ? "Online" : request.city || "In-person"})`,
    type: "bid",
    link: "/dashboard?tab=browse",
  })));
  await logAudit({ action: "tuition_request_published", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Request", targetId: request.id, metadata: { subject: request.subject, level: request.level, teachingMode: request.teachingMode, currency: request.currency, countryCode: request.countryCode, notifiedTutors: matchingTutors.length } });

  try {
    const { amountPKR } = convertToPKR(request.budget, request.currency);
    const adminAlert = adminNewTuitionRequestEmail({
      studentName: user.name || req.user?.name || "Student",
      studentEmail: user.email || req.user?.email || "",
      studentPhone: user.phone || req.user?.phone,
      subject: request.subject,
      level: request.level,
      teachingMode: request.teachingMode,
      countryName: request.countryName,
      countryCode: request.countryCode,
      city: request.city,
      area: request.area,
      budget: request.budget,
      currency: request.currency || "PKR",
      budgetPKR: amountPKR,
      pricingUnit: request.pricingUnit || "hour",
      schedule: request.schedule,
      description: request.description || request.learningObjectives,
      curriculum: request.curriculum,
    });
    await sendEmail({ to: "mentiserapk@gmail.com", subject: adminAlert.subject, html: adminAlert.html });
  } catch (alertErr) {
    console.error("Failed to send admin tuition request alert email:", alertErr);
  }

  res.status(201).json({ success: true, message: "Request created", request });
};

// @desc    Save private in-progress tuition request for abandoned-request recovery emails
// @route   POST /api/requests/draft
// @access  Private (student)
export const saveRequestDraftProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = [
    "subject", "level", "description", "budget", "teachingMode", "city", "schedule",
    "pricingUnit", "classGrade", "curriculum", "examType", "preferredDays", "preferredStartTime",
    "sessionDurationMinutes", "sessionsPerWeek", "expectedStartDate",
    "tutorId", "tutorName", "selectedDate", "selectedStartTime", "selectedEndTime",
  ];
  const type = req.body?.type === "direct_booking" ? "direct_booking" : "student_request";
  const data = Object.fromEntries(
    allowed
      .filter((key) => req.body?.[key] !== undefined && req.body?.[key] !== "")
      .map((key) => [key, req.body[key]])
  );

  if (Object.keys(data).length === 0) {
    res.status(200).json({ success: true, tracked: false });
    return;
  }

  const journey = await AbandonedJourney.findOneAndUpdate(
    { user: req.user?._id, type, completedAt: { $exists: false } },
    { $set: { data }, $setOnInsert: { user: req.user?._id, type, remindersSent: [] } },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, tracked: true, journeyId: journey._id });
};

// @desc    Get all open requests (tutors browse)
// @route   GET /api/requests
// @access  Private
export const getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  // Block unapproved tutors
  if (req.user?.role === "tutor") {
    const TutorProfile = (await import("../models/TutorProfile.model")).default;
    const profile = await TutorProfile.findOne({ user: req.user._id });
    if (!profile || profile.verificationStatus !== "approved") {
      res.status(403).json({
        success: false,
        code: "TUTOR_NOT_APPROVED",
        message: "Your profile must be approved before you can browse requests.",
      });
      return;
    }
  }

  const { subject, level, city, country, teachingMode, currency, page = "1", limit = "10" } = req.query;
  const filter: Record<string, unknown> = { status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, isDirect: { $ne: true } };

  if (subject) filter.subject = new RegExp(subject as string, "i");
  if (level) filter.level = level;
  if (city) filter.city = new RegExp(city as string, "i");
  if (country) filter.countryCode = (country as string).toUpperCase();
  if (teachingMode && teachingMode !== "all") {
    if (teachingMode === "online") {
      filter.teachingMode = { $in: ["online", "both"] };
    } else if (teachingMode === "in_person" || teachingMode === "home") {
      filter.teachingMode = { $in: ["in_person", "home", "both"] };
    } else {
      filter.teachingMode = teachingMode;
    }
  }
  if (currency) filter.currency = (currency as string).toUpperCase();

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Request.countDocuments(filter);
  const requests = await Request.find(filter)
    .populate("student", "name city countryName countryCode avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  if (req.user?.role === "tutor") {
    const requestsWithOffer = await Promise.all(
      requests.map(async (request) => {
        const bid = await Bid.findOne({ request: request._id, tutor: req.user?._id }).select("amount currency status expiresAt pricingUnit createdAt").lean();
        return { ...request.toObject(), bid };
      })
    );
    res.status(200).json({ success: true, total, page: pageNum, requests: requestsWithOffer });
    return;
  }

  res.status(200).json({ success: true, total, page: pageNum, requests });
};

// @desc    Get my requests (student)
// @route   GET /api/requests/my
// @access  Private (student)
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await Request.find({ student: req.user?._id }).sort("-createdAt");
  res.status(200).json({ success: true, requests });
};

// @desc    Cancel request
// @route   PATCH /api/requests/:id/cancel
// @access  Private (student)
export const cancelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.id, student: req.user?._id });
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }
  request.status = "cancelled";
  await request.save();
  res.status(200).json({ success: true, message: "Request cancelled" });
};

// @desc    Place a bid on a request
// @route   POST /api/requests/:id/bids
// @access  Private (tutor)
export const placeBid = async (req: AuthRequest, res: Response): Promise<void> => {
  // Block unapproved tutors
  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const tutorProfile = await TutorProfile.findOne({ user: req.user?._id });
  if (!tutorProfile || tutorProfile.verificationStatus !== "approved") {
    res.status(403).json({
      success: false,
      code: "TUTOR_NOT_APPROVED",
      message: "Your profile must be approved before you can send offers.",
    });
    return;
  }
  if (tutorProfile.suspendedAt || tutorProfile.reVerificationRequired) {
    res.status(403).json({
      success: false,
      code: "TUTOR_SUSPENDED",
      message: "Your profile is currently suspended or requires re-verification. Please check your application status.",
    });
    return;
  }
  const requested = await Request.findById(req.params.id).select("student subject level teachingMode city countryCode countryName currency status budget pricingUnit allowCounterOffers isDirect targetTutor preferredTutorCountries isWorldwideEligible");
  if (!requested || !["open", "published", "receiving_offers", "negotiating"].includes(requested.status)) { res.status(400).json({ success: false, message: "Request is not accepting offers" }); return; }
  
  const subjectMatches = tutorProfile.subjects.some(subject => subject.toLowerCase() === requested.subject.toLowerCase());
  const levelMatches = tutorProfile.levels.includes(requested.level as any);
  const modeMatches = tutorProfile.teachingMode === "both" || requested.teachingMode === "both" || tutorProfile.teachingMode === requested.teachingMode;
  
  // Dual location matching model:
  // - Online tutoring: Borderless worldwide matching (unless student specified country preferences).
  // - In-Person / Home tuition: Strictly matches tutors in the same country and city/service area.
  let locationMatches = false;
  if (requested.teachingMode === "online" || tutorProfile.teachingMode === "online") {
    if (requested.preferredTutorCountries && requested.preferredTutorCountries.length > 0) {
      locationMatches = requested.preferredTutorCountries.includes(tutorProfile.countryCode || "PK");
    } else {
      locationMatches = true; // Borderless
    }
  } else {
    // In-person / home tuition
    const countryMatch = !requested.countryCode || (tutorProfile.countryCode || "PK") === requested.countryCode;
    const cityMatch = !requested.city || Boolean(tutorProfile.city && tutorProfile.city.toLowerCase() === requested.city.toLowerCase());
    locationMatches = Boolean(countryMatch && cityMatch);
  }

  if (!subjectMatches || !levelMatches || !modeMatches || !locationMatches) {
    res.status(403).json({ success: false, code: "OFFER_NOT_RELEVANT", message: "This request does not match your approved subject, level, mode, or service location." });
    return;
  }

  const currency = requested.currency || "PKR";
  if (!requested.allowCounterOffers && req.body.amount !== requested.budget) {
    res.status(409).json({ success: false, code: "COUNTERS_DISABLED", message: `This request only accepts the proposed rate of ${currency} ${requested.budget.toLocaleString()}.` });
    return;
  }

  // ── Enforce bid limit ──
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  // Reset monthly count if new month has started
  if (!user.bidsResetDate || isNewMonth(new Date(user.bidsResetDate))) {
    user.bidsThisMonth = 0;
    user.bidsResetDate = new Date();
    await user.save();
  }

  const bidLimit = PLAN_BID_LIMITS[user.plan || "free"];
  const bidsUsed = user.bidsThisMonth || 0;

  if (bidLimit !== -1 && bidsUsed >= bidLimit) {
    const planNames: Record<string, string> = { free: "Free", standard: "Standard", premium: "Premium" };
    res.status(403).json({
      success: false,
      code: "BID_LIMIT_REACHED",
      message: `You've used all ${bidLimit} offers included in your ${planNames[user.plan || "free"]} plan this month. Upgrade your plan to send more offers.`,
    });
    return;
  }

  const request = requested;
  if (!request || !["open", "published", "receiving_offers", "negotiating"].includes(request.status)) {
    res.status(400).json({ success: false, message: "Request is not accepting offers" });
    return;
  }

  // Block bidding on direct requests not targeted at this tutor
  if (request.isDirect && request.targetTutor?.toString() !== req.user?._id?.toString()) {
    res.status(403).json({ success: false, message: "This is a private booking request." });
    return;
  }

  // Check if tutor already bid
  const existingBid = await Bid.findOne({ request: req.params.id, tutor: req.user?._id });
  if (existingBid) {
    res.status(400).json({ success: false, message: "You already sent an offer for this request" });
    return;
  }

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const offersToday = await Bid.countDocuments({ tutor: req.user?._id, createdAt: { $gte: dayStart } });
  if (offersToday >= 25) { res.status(429).json({ success: false, code: "DAILY_OFFER_LIMIT", message: "You have reached today's offer limit. Try again tomorrow." }); return; }
  const normalizedMessage = String(req.body.message || "").trim().toLowerCase();
  if (normalizedMessage) {
    const recent = await Bid.find({ tutor: req.user?._id, createdAt: { $gte: dayStart } }).select("message").lean();
    if (recent.filter(item => item.message.trim().toLowerCase() === normalizedMessage).length >= 5) { res.status(429).json({ success: false, code: "DUPLICATE_OFFER_CONTENT", message: "Please personalize your offer for this student instead of repeating the same message." }); return; }
  }

  const moderationReasons = [containsContactInfo(req.body.message || "") ? "external_contact" : "", req.body.amount < request.budget * 0.35 || req.body.amount > request.budget * 3 ? "unusual_price" : ""].filter(Boolean);
  const bid = await Bid.create({
    request: new Types.ObjectId(req.params.id as string),
    tutor: req.user?._id,
    amount: req.body.amount,
    currency: request.currency || tutorProfile.currency || "PKR",
    originalAmount: req.body.amount,
    originalCurrency: request.currency || tutorProfile.currency || "PKR",
    convertedRequestAmount: req.body.amount,
    exchangeRate: 1,
    message: req.body.message,
    availability: req.body.availability,
    initialStudentRate: request.budget,
    pricingUnit: request.pricingUnit,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    flaggedForModeration: moderationReasons.length > 0,
    moderationReasons,
  });

  await OfferNegotiation.create({
    offer: bid._id,
    senderUser: req.user?._id,
    senderRole: "tutor",
    amount: bid.amount,
    message: bid.message,
    sequenceNumber: 1,
    expiresAt: bid.expiresAt,
    flaggedForModeration: containsContactInfo(bid.message),
  });

  await logAudit({
    action: "offer_created",
    actor: req.user?.name,
    actorId: req.user?._id?.toString(),
    entity: "Bid",
    targetId: bid.id,
    metadata: {
      requestId: request.id,
      amount: bid.amount,
      currency: bid.currency,
      pricingUnit: bid.pricingUnit,
      flaggedForModeration: containsContactInfo(bid.message),
    },
  });

  await Request.updateOne({ _id: request._id, status: { $in: ["open", "published"] } }, { status: "receiving_offers" });
  await incrementBidCount(req.user?._id?.toString() || "");

  // Notify student
  const io = req.app.get("io");
  await sendNotification(io, request.student.toString(), {
    title: "📬 New Tutor Offer",
    message: `A verified tutor sent an offer of ${currency} ${req.body.amount.toLocaleString()} on your tuition request.`,
    type: "bid",
    link: "/dashboard",
  });

  try {
    const studentUser = await User.findById(request.student).select("name email");
    if (studentUser) {
      const { subject, html } = newBidEmail(studentUser.name, req.body.amount);
      await sendEmail({ to: studentUser.email, subject, html });
    }
  } catch (err) {
    console.error("Failed to send new bid email:", err);
  }

  res.status(201).json({ success: true, message: "Offer sent successfully", bid });
};

// @desc    Get all bids for a request
// @route   GET /api/requests/:id/bids
// @access  Private (student who owns the request)
export const getBidsForRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.id, student: req.user?._id });
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }

  const bids = await Bid.find({ request: req.params.id })
    .populate("tutor", "name avatar city")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: bids.length, bids });
};

// ── Relevant excerpt: request.controller.ts ──
// Replaces the old acceptBid. Two functions now:
//   1. initiateAcceptBid  — route handler, reserves the offer, starts payment checkout
//   2. finalizeBidAcceptance — NOT a route; called only by the payment webhook once payment confirms

const PAYMENT_HOLD_MINUTES = 30;

// If a previous accept attempt's payment reservation has expired (student
// abandoned checkout), revert the request/bid back to an acceptable state
// so the bid isn't stuck in limbo forever. Called defensively at the start
// of the accept flow.
export async function releaseExpiredPaymentHold(requestId: Types.ObjectId): Promise<void> {
  const staleBid = await Bid.findOne({
    request: requestId,
    status: "payment_pending",
    paymentPendingExpiresAt: { $lte: new Date() },
  });

  if (!staleBid) return;

  // Best-effort revert — not wrapped in the caller's transaction since this
  // is cleanup for a PAST abandoned attempt, not part of the current one.
  await Bid.updateOne(
    { _id: staleBid._id, status: "payment_pending" },
    { status: "submitted", $unset: { paymentPendingExpiresAt: "" } }
  );
  await Request.updateOne(
    { _id: requestId, status: "awaiting_payment" },
    { status: "open" }
  );
}

// @desc    Accept an offer — reserves it and starts payment checkout.
//          The booking is NOT created here; it's created by
//          finalizeBidAcceptance once payment is confirmed via webhook.
// @route   PATCH /api/requests/:id/bids/:bidId/accept
// @access  Private (student)
export const initiateAcceptBid = async (req: AuthRequest, res: Response): Promise<void> => {
  const requestId = new Types.ObjectId(req.params.id as string);
  const bidId = new Types.ObjectId(req.params.bidId as string);

  await releaseExpiredPaymentHold(requestId);

  const request = await Request.findById(requestId);
  if (!request || !["open", "published", "receiving_offers", "negotiating"].includes(request.status)) {
    res.status(400).json({ success: false, message: "Request not available" });
    return;
  }

  const bid = await Bid.findOne({
    _id: bidId,
    request: requestId,
    status: { $in: ["pending", "submitted", "viewed", "countered"] },
  });

  if (!bid) {
    res.status(404).json({ success: false, message: "Offer not found or does not belong to this request" });
    return;
  }

  if (bid.expiresAt && bid.expiresAt.getTime() <= Date.now()) {
    res.status(410).json({ success: false, message: "This offer has expired." });
    return;
  }

  const isOwner = request.student.toString() === req.user?._id?.toString();
  const isDirectTutorAccept = request.isDirect && bid.tutor.toString() === req.user?._id?.toString();
  if (!isOwner && !isDirectTutorAccept) {
    res.status(403).json({ success: false, message: "Not authorized to accept this offer" });
    return;
  }

  // Atomic guard — identical purpose to the original: only one accept
  // attempt can win this transition, so two concurrent accept clicks can't
  // both proceed. Everything downstream is safe BECAUSE this succeeded.
  const reservedRequest = await Request.findOneAndUpdate(
    { _id: requestId, status: { $in: ["open", "published", "receiving_offers", "negotiating"] } },
    { status: "awaiting_payment" },
    { new: true }
  );

  if (!reservedRequest) {
    res.status(409).json({ success: false, message: "This request was just accepted or is no longer available." });
    return;
  }

  const paymentPendingExpiresAt = new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000);
  bid.status = "payment_pending";
  bid.paymentPendingExpiresAt = paymentPendingExpiresAt;
  await bid.save();

  try {
    const student = await User.findById(req.user?._id).select("name email phone");
    const checkoutUrl = await createTransaction({
      amount: bid.amount,
      customerMobileNo: student?.phone || "03000000000",
      customerEmail: student?.email || "",
      // "BID-" prefix lets the webhook handler tell this apart from a
      // plain booking-id checkout (see payment.controller.ts).
      basketId: `BID-${bid._id.toString()}`,
      description: `TUTORERA offer acceptance ${bid._id.toString()}`,
      successUrl: `${process.env.CLIENT_URL}/dashboard?payment=success&bid=${bid._id}`,
      failureUrl: `${process.env.CLIENT_URL}/dashboard?payment=failed&bid=${bid._id}`,
      checkoutUrl: `${process.env.CLIENT_URL}/dashboard?payment=processing&bid=${bid._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Redirecting to payment. Your offer will be confirmed once payment completes.",
      checkoutUrl,
    });
  } catch (err: any) {
    // Checkout creation failed — roll back the reservation immediately so
    // the request/bid aren't stranded in "awaiting_payment" until the next
    // lazy cleanup happens to run.
    await Request.updateOne({ _id: requestId, status: "awaiting_payment" }, { status: "open" });
    await Bid.updateOne(
      { _id: bid._id, status: "payment_pending" },
      { status: "submitted", $unset: { paymentPendingExpiresAt: "" } }
    );

    console.error("Failed to create payment checkout for offer acceptance:", err);
    res.status(502).json({ success: false, message: "Unable to start payment. Please try again." });
  }
};

// Called ONLY by the payment webhook (payment.controller.ts) once the
// authorized payment gateway confirms payment for a "BID-<id>" checkout. Runs the same
// transactional booking-creation logic the old acceptBid used to run
// synchronously — atomic accept guard, reject other bids, create the
// booking (now with paymentStatus already "confirmed"), lock the slot.
export async function finalizeBidAcceptance(bidId: string, io: any): Promise<void> {
  const session = await mongoose.startSession();

  try {
    let responseBooking: any = null;
    let responsePayload: {
      bidTutor: string;
      requestStudent: string;
      isDirect: boolean;
      selectedDate?: string;
      selectedStartTime?: string;
      selectedEndTime?: string;
      subject: string;
      amount: number;
    } | null = null;

    await session.withTransaction(async () => {
      // Atomic guard — only proceeds if this bid is still awaiting payment
        // confirmation. Protects against documented at-least-once
      // at-least-once webhook delivery calling this twice for the same
      // event; the second call finds status already "accepted" and no-ops.
      const bid = await Bid.findOneAndUpdate(
        { _id: new Types.ObjectId(bidId), status: "payment_pending" },
        { status: "accepted" },
        { new: true, session }
      );

      if (!bid) {
        // Already finalized by a prior webhook delivery, or the hold expired
        // and was reverted before payment confirmed — nothing to do.
        return;
      }

      const request = await Request.findById(bid.request).session(session);
      if (!request) return;

      request.status = "closed";
      await request.save({ session });

      await Bid.updateMany(
        { request: request._id, _id: { $ne: bid._id } },
        { status: "not_selected" },
        { session }
      );

      const existingBookingsCount = await Booking.countDocuments({
        student: request.student,
        tutor: bid.tutor,
      }).session(session);

      const fees = calculateMarketplaceFees(bid.amount);

      const bookingArr = await Booking.create([{
        student: request.student,
        tutor: bid.tutor,
        request: request._id,
        bid: bid._id,
        amount: bid.amount,
        finalAgreedRate: bid.amount,
        pricingUnit: bid.pricingUnit || "hour",
        sessionCount: 1,
        ...fees,
        platformFee: fees.tutorFee + fees.tax,
        tutorPayout: fees.tutorNet,
        schedule: request.schedule,
        teachingMode: request.teachingMode,
        isFirstSession: existingBookingsCount === 0,
        // Payment already succeeded via the authorized payment gateway before this booking
        // was ever created — no manual confirmation step needed.
        paymentStatus: "confirmed",
        paymentNote: "Paid via authorized payment gateway before booking creation",
      }], { session });
      const booking = bookingArr[0];

      await OfferNegotiation.updateMany({ offer: bid._id, status: "active" }, { status: "accepted" }, { session });

      if (request.isDirect && request.selectedDate && request.selectedStartTime && request.selectedEndTime) {
        await BookedSlot.create([{
          tutor: bid.tutor,
          student: request.student,
          booking: booking._id,
          date: new Date(request.selectedDate),
          startTime: request.selectedStartTime,
          endTime: request.selectedEndTime,
        }], { session });
      }

      responseBooking = booking;
      responsePayload = {
        bidTutor: bid.tutor.toString(),
        requestStudent: request.student.toString(),
        isDirect: !!request.isDirect,
        selectedDate: request.selectedDate,
        selectedStartTime: request.selectedStartTime,
        selectedEndTime: request.selectedEndTime,
        subject: request.subject,
        amount: bid.amount,
      };
    });

    if (responsePayload && responseBooking) {
      const payload = responsePayload as {
        bidTutor: string;
        requestStudent: string;
        isDirect: boolean;
        selectedDate?: string;
        selectedStartTime?: string;
        selectedEndTime?: string;
        subject: string;
        amount: number;
      };

      // Notifications/emails are best-effort — same as the original flow.
      if (io) {
        await sendNotification(io, payload.bidTutor, {
          title: "✅ Offer Accepted & Paid!",
          message: "The student has completed payment. A booking has been created.",
          type: "booking",
          link: "/dashboard",
        });
        await sendNotification(io, payload.requestStudent, {
          title: "📅 Booking Confirmed",
          message: `Your payment was received and your booking for ${payload.subject} is confirmed.`,
          type: "booking",
          link: "/dashboard",
        });
      }

      try {
        const [tutorUser, studentUser] = await Promise.all([
          User.findById(payload.bidTutor).select("name email"),
          User.findById(payload.requestStudent).select("name email"),
        ]);

        if (tutorUser && studentUser) {
          const bidEmail = bidAcceptedEmail(tutorUser.name, studentUser.name, payload.amount);
          const bookingEmail = bookingConfirmedEmail(studentUser.name, tutorUser.name, payload.amount);
          await Promise.all([
            sendEmail({ to: tutorUser.email, subject: bidEmail.subject, html: bidEmail.html }),
            sendEmail({ to: studentUser.email, subject: bookingEmail.subject, html: bookingEmail.html }),
          ]);
        }
      } catch (err) {
        console.error("Failed to send booking/offer emails after payment:", err);
      }
    }
  } finally {
    await session.endSession();
  }
}

// @desc    Create a direct booking request targeted at a specific tutor
// @route   POST /api/requests/direct
// @access  Private (student)
export const createDirectBookingRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorId, subject, level, description, teachingMode, city, schedule, selectedDate, selectedStartTime, selectedEndTime } = req.body;

  if (!tutorId || !subject || !level || !description || !schedule) {
    res.status(400).json({ success: false, message: "Missing required fields." });
    return;
  }

  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const tutorProfile = await TutorProfile.findOne({ user: tutorId });
  if (!tutorProfile || tutorProfile.verificationStatus !== "approved") {
    res.status(404).json({ success: false, message: "Tutor not found or not available for booking." });
    return;
  }

  // Prevent duplicate direct requests to the same tutor while one is still pending
  const existingPending = await Request.findOne({
    student: req.user?._id,
    targetTutor: tutorId,
    status: "open",
  });
  if (existingPending) {
    res.status(400).json({
      success: false,
      message: "You already have a pending booking request with this tutor.",
    });
    return;
  }

  const request = await Request.create({
    student: req.user?._id,
    subject,
    level,
    description,
    budget: tutorProfile.hourlyRate,
    currency: tutorProfile.currency || "PKR",
    countryCode: req.body.countryCode || (req.user as any)?.countryCode || tutorProfile.countryCode || "PK",
    countryName: req.body.countryName || (req.user as any)?.countryName || tutorProfile.countryName || "Pakistan",
    timezone: req.body.timezone || (req.user as any)?.timezone || tutorProfile.timezone || "Asia/Karachi",
    teachingMode: teachingMode || tutorProfile.teachingMode,
    city: city || tutorProfile.city,
    schedule: selectedDate && selectedStartTime
      ? `${selectedDate} ${selectedStartTime}–${selectedEndTime}`
      : schedule,
    targetTutor: tutorId,
    isDirect: true,
    selectedDate: selectedDate || "",
    selectedStartTime: selectedStartTime || "",
    selectedEndTime: selectedEndTime || "",
  });

  const bid = await Bid.create({
    request: request._id,
    tutor: tutorId,
    amount: tutorProfile.hourlyRate,
    currency: tutorProfile.currency || "PKR",
    originalAmount: tutorProfile.hourlyRate,
    originalCurrency: tutorProfile.currency || "PKR",
    convertedRequestAmount: tutorProfile.hourlyRate,
    exchangeRate: 1,
    initialStudentRate: tutorProfile.hourlyRate,
    pricingUnit: "hour",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    message: "Direct booking request",
    isDirect: true,
  });

  await AbandonedJourney.updateMany(
    { user: req.user?._id, type: "direct_booking", completedAt: { $exists: false } },
    { $set: { completedAt: new Date() } }
  );

  const io = req.app.get("io");
  await sendNotification(io, tutorId, {
    title: "📩 New Direct Booking Request",
    message: `${req.user?.name} wants to book a session with you for ${subject}.`,
    type: "booking",
    link: "/dashboard?tab=browse",
  });

   try {
    const tutorUser = await User.findById(tutorId).select("name email");
    if (tutorUser) {
      const { subject: emailSubject, html } = directBookingRequestEmail(tutorUser.name, req.user?.name || "A student", subject);
      await sendEmail({ to: tutorUser.email, subject: emailSubject, html });
    }

    const { amountPKR } = convertToPKR(request.budget, request.currency);
    const adminAlert = adminNewTuitionRequestEmail({
      studentName: req.user?.name || "Student",
      studentEmail: req.user?.email || "",
      studentPhone: req.user?.phone,
      subject: request.subject,
      level: request.level || "Standard",
      teachingMode: request.teachingMode || "direct",
      countryName: request.countryName,
      countryCode: request.countryCode,
      city: request.city,
      area: request.area,
      budget: request.budget,
      currency: request.currency || "PKR",
      budgetPKR: amountPKR,
      pricingUnit: request.pricingUnit || "hour",
      schedule: request.schedule,
      description: `Direct booking with tutor ID: ${tutorId}`,
      curriculum: request.curriculum,
    });
    await sendEmail({ to: "mentiserapk@gmail.com", subject: adminAlert.subject, html: adminAlert.html });
  } catch (err) {
    console.error("Failed to send direct booking request email / admin alert:", err);
  }

  res.status(201).json({
    success: true,
    message: "Booking request sent to the tutor. You'll be notified once they respond.",
    request,
    bid,
  });
};

// @desc    Get direct booking requests for the logged-in tutor
// @route   GET /api/requests/direct/my
// @access  Private (tutor)
export const getMyDirectRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await Request.find({
    targetTutor: req.user?._id,
    isDirect: true,
    status: "open",
  })
    .populate("student", "name city avatar")
    .sort("-createdAt");

  const requestsWithBid = await Promise.all(
    requests.map(async (r) => {
      const bid = await Bid.findOne({ request: r._id, tutor: req.user?._id });
      return { ...r.toObject(), bid };
    })
  );

  res.status(200).json({ success: true, total: requestsWithBid.length, requests: requestsWithBid });
};

// @desc    Reject a bid
// @route   PATCH /api/requests/:id/bids/:bidId/reject
// @access  Private (student who owns the request, OR the tutor on a direct request)
export const rejectBid = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }

  const bid = await Bid.findOne({
    _id: req.params.bidId,
    request: req.params.id,
  });
  if (!bid) {
    res.status(404).json({ success: false, message: "Offer not found or does not belong to this request" });
    return;
  }

  if (["accepted", "rejected", "withdrawn", "expired", "not_selected"].includes(bid.status)) {
    res.status(409).json({ success: false, message: "This offer can no longer be changed." });
    return;
  }

  const isOwner = request.student.toString() === req.user?._id?.toString();
  const isTargetTutorDecline = request.isDirect && bid.tutor.toString() === req.user?._id?.toString();

  if (!isOwner && !isTargetTutorDecline) {
    res.status(403).json({ success: false, message: "Not authorized to reject this offer" });
    return;
  }

  bid.status = "rejected";
  await bid.save();

  if (request.isDirect && isTargetTutorDecline) {
    request.status = "cancelled";
    await request.save();

    const io = req.app.get("io");
    await sendNotification(io, request.student.toString(), {
      title: "Booking Request Declined",
      message: `The tutor was unable to accept your booking request for ${request.subject}.`,
      type: "booking",
      link: "/dashboard",
    });

   try {
      const studentUser = await User.findById(request.student).select("name email");
      if (studentUser) {
        const { subject, html } = directBookingDeclinedEmail(studentUser.name, request.subject);
        await sendEmail({ to: studentUser.email, subject, html });
      }
    } catch (err) {
      console.error("Failed to send booking decline email:", err);
    }
  }

  res.status(200).json({ success: true, message: "Offer declined", bid });
};

// @desc    Get a preview of open requests for public homepage (no auth required)
// @route   GET /api/requests/public/preview
// @access  Public
export const getPublicRequestsPreview = async (req: ExpressRequest, res: Response): Promise<void> => {
  const { page = "1", limit = "12" } = req.query;
  const filter: Record<string, unknown> = { status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, isDirect: { $ne: true } };

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
  const skip = (pageNum - 1) * limitNum;

  const total = await Request.countDocuments(filter);
  const requests = await Request.find(filter)
    .populate("student", "name city avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum)
    .select("subject level budget pricingUnit teachingMode city schedule createdAt student");

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    requests,
  });
};
