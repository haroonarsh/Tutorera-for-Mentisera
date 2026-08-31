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
import { bookingConfirmedEmail, bidAcceptedEmail, newBidEmail, directBookingRequestEmail, directBookingAcceptedEmail, directBookingDeclinedEmail } from "../utils/emailTemplates";

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

  // ── Increment monthly counter ──
  await User.findByIdAndUpdate(req.user?._id, {
    $inc: { requestsThisMonth: 1 },
  });

  // Notify a bounded set of relevant approved tutors, never the entire marketplace.
  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const matchFilter: Record<string, unknown> = { verificationStatus: "approved", subjects: request.subject, levels: request.level };
  if (request.teachingMode !== "online") matchFilter.$or = [{ teachingMode: "both", city: request.city }, { teachingMode: request.teachingMode, city: request.city }];
  else matchFilter.teachingMode = { $in: ["online", "both"] };
  const matchingTutors = await TutorProfile.find(matchFilter).select("user").limit(25).lean();
  await Promise.all(matchingTutors.map(profile => sendNotification(req.app.get("io"), profile.user.toString(), { title: "Matching Tuition Request", message: `${request.subject} · ${request.level} · proposed PKR ${request.budget.toLocaleString()}/${request.pricingUnit}`, type: "bid", link: "/dashboard?tab=browse" })));
  await logAudit({ action: "tuition_request_published", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Request", targetId: request.id, metadata: { subject: request.subject, level: request.level, teachingMode: request.teachingMode, notifiedTutors: matchingTutors.length } });

  res.status(201).json({ success: true, message: "Request created", request });
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

  const { subject, level, city, page = "1", limit = "10" } = req.query;
  const filter: Record<string, unknown> = { status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, isDirect: { $ne: true } };

  if (subject) filter.subject = new RegExp(subject as string, "i");
  if (level) filter.level = level;
  if (city) filter.city = new RegExp(city as string, "i");

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Request.countDocuments(filter);
  const requests = await Request.find(filter)
    .populate("student", "name city avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  if (req.user?.role === "tutor") {
    const requestsWithOffer = await Promise.all(
      requests.map(async (request) => {
        const bid = await Bid.findOne({ request: request._id, tutor: req.user?._id }).select("amount status expiresAt pricingUnit createdAt").lean();
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
  const requested = await Request.findById(req.params.id).select("student subject level teachingMode city status budget pricingUnit allowCounterOffers isDirect targetTutor");
  if (!requested || !["open", "published", "receiving_offers", "negotiating"].includes(requested.status)) { res.status(400).json({ success: false, message: "Request is not accepting offers" }); return; }
  const subjectMatches = tutorProfile.subjects.some(subject => subject.toLowerCase() === requested.subject.toLowerCase());
  const levelMatches = tutorProfile.levels.includes(requested.level as any);
  const modeMatches = tutorProfile.teachingMode === "both" || requested.teachingMode === "both" || tutorProfile.teachingMode === requested.teachingMode;
  const locationMatches = requested.teachingMode === "online" || tutorProfile.teachingMode === "online" || !requested.city || tutorProfile.city.toLowerCase() === requested.city.toLowerCase();
  if (!subjectMatches || !levelMatches || !modeMatches || !locationMatches) { res.status(403).json({ success: false, code: "OFFER_NOT_RELEVANT", message: "This request does not match your approved subject, level, mode, or city." }); return; }
  if (!requested.allowCounterOffers && req.body.amount !== requested.budget) { res.status(409).json({ success: false, code: "COUNTERS_DISABLED", message: `This request only accepts the proposed rate of PKR ${requested.budget.toLocaleString()}.` }); return; }

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
    message: req.body.message,
    availability: req.body.availability,
    initialStudentRate: request.budget,
    pricingUnit: request.pricingUnit,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    flaggedForModeration: moderationReasons.length > 0,
    moderationReasons,
  });

  await OfferNegotiation.create({ offer: bid._id, senderUser: req.user?._id, senderRole: "tutor", amount: bid.amount, message: bid.message, sequenceNumber: 1, expiresAt: bid.expiresAt, flaggedForModeration: containsContactInfo(bid.message) });
  await logAudit({ action: "offer_created", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: bid.id, metadata: { requestId: request.id, amount: bid.amount, pricingUnit: bid.pricingUnit, flaggedForModeration: containsContactInfo(bid.message) } });
  await Request.updateOne({ _id: request._id, status: { $in: ["open", "published"] } }, { status: "receiving_offers" });

  await incrementBidCount(req.user?._id?.toString() || "");

  // Notify student
  const io = req.app.get("io");
  await sendNotification(io, request.student.toString(), {
    title: "📬 New Tutor Offer",
    message: `A verified tutor sent an offer of PKR ${req.body.amount} on your tuition request.`,
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

// @desc    Accept a bid → creates booking automatically
// @route   PATCH /api/requests/:id/bids/:bidId/accept
// @access  Private (student)
export const acceptBid = async (req: AuthRequest, res: Response): Promise<void> => {
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
      const request = await Request.findById(new Types.ObjectId(req.params.id as string)).session(session);

      if (!request || !["open", "published", "receiving_offers", "negotiating"].includes(request.status)) {
        throw { statusCode: 400, message: "Request not available" };
      }

      const bid = await Bid.findOne({
        _id: new Types.ObjectId(req.params.bidId as string),
        request: new Types.ObjectId(req.params.id as string),
        status: { $in: ["pending", "submitted", "viewed", "countered"] },
      }).session(session);

      if (!bid) {
        throw { statusCode: 404, message: "Offer not found or does not belong to this request" };
      }

      // Authorization: either the student who owns the request, OR the tutor on a direct request accepting their own bid
      const isOwner = request.student.toString() === req.user?._id?.toString();
      const isDirectTutorAccept = request.isDirect && bid.tutor.toString() === req.user?._id?.toString();

      if (!isOwner && !isDirectTutorAccept) {
        throw { statusCode: 403, message: "Not authorized to accept this offer" };
      }

      // Atomic conditional update — only succeeds if request is still "open".
      // This is what prevents two concurrent accept calls from both proceeding.
      const closedRequest = await Request.findOneAndUpdate(
        { _id: request._id, status: { $in: ["open", "published", "receiving_offers", "negotiating"] } },
        { status: "closed" },
        { new: true, session }
      );

      if (!closedRequest) {
        throw { statusCode: 409, message: "This request was just accepted or is no longer available." };
      }

      // Accept this bid
      bid.status = "accepted";
      await bid.save({ session });

      // Reject all other bids
      await Bid.updateMany(
        { request: request._id, _id: { $ne: bid._id } },
        { status: "not_selected" },
        { session }
      );

      // Auto-detect if this is the first booking between this student and this tutor
      const existingBookingsCount = await Booking.countDocuments({
        student: request.student,
        tutor: bid.tutor,
      }).session(session);

      if (bid.expiresAt && bid.expiresAt.getTime() <= Date.now()) throw { statusCode: 410, message: "This offer has expired." };
      const fees = calculateMarketplaceFees(bid.amount);

      // Auto-create booking
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
      }], { session });
      const booking = bookingArr[0];
      await OfferNegotiation.updateMany({ offer: bid._id, status: "active" }, { status: "accepted" }, { session });

      // Lock the slot if it's a direct booking with a slot
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

    // ── Everything below happens AFTER the transaction commits successfully ──
    // Notifications/emails are best-effort side effects, not part of the atomic write.
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
      const io = req.app.get("io");

      await sendNotification(io, payload.bidTutor, {
        title: "✅ Offer Accepted!",
        message: "Your offer has been accepted! A booking has been created.",
        type: "booking",
        link: "/dashboard",
      });

      await sendNotification(io, payload.requestStudent, {
        title: "📅 Booking Confirmed — Payment Required",
        message: `Your booking has been created! Please send PKR ${payload.amount.toLocaleString()} to NayaPay ID: mentisera@nayapay and email proof to billing@tutorera.ac.pk.`,
        type: "booking",
        link: "/dashboard",
      });

      try {
        const [tutorUser, studentUser] = await Promise.all([
          User.findById(payload.bidTutor).select("name email"),
          User.findById(payload.requestStudent).select("name email"),
        ]);

        if (tutorUser && studentUser) {
          if (payload.isDirect && payload.selectedDate) {
            const tutorMail = directBookingAcceptedEmail(tutorUser.name, studentUser.name, payload.subject, payload.selectedDate, payload.selectedStartTime, payload.selectedEndTime);
            const studentMail = directBookingAcceptedEmail(studentUser.name, tutorUser.name, payload.subject, payload.selectedDate, payload.selectedStartTime, payload.selectedEndTime, { amount: payload.amount });
            await Promise.all([
              sendEmail({ to: tutorUser.email, subject: tutorMail.subject, html: tutorMail.html }),
              sendEmail({ to: studentUser.email, subject: studentMail.subject, html: studentMail.html }),
            ]);
          } else {
            const bidEmail = bidAcceptedEmail(tutorUser.name, studentUser.name, payload.amount);
            const bookingEmail = bookingConfirmedEmail(studentUser.name, tutorUser.name, payload.amount);
            await Promise.all([
              sendEmail({ to: tutorUser.email, subject: bidEmail.subject, html: bidEmail.html }),
              sendEmail({ to: studentUser.email, subject: bookingEmail.subject, html: bookingEmail.html }),
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to send booking/offer emails:", err);
      }

      res.status(200).json({
        success: true,
        message: "Offer accepted. Booking created successfully.",
        booking: responseBooking,
      });
    }
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const message = err?.message || "Failed to accept offer. Please try again.";
    res.status(statusCode).json({ success: false, message });
  } finally {
    await session.endSession();
  }
};

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
    initialStudentRate: tutorProfile.hourlyRate,
    pricingUnit: "hour",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    message: "Direct booking request",
    isDirect: true,
  });

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
  } catch (err) {
    console.error("Failed to send direct booking request email:", err);
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
  const requests = await Request.find({ status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, isDirect: { $ne: true } })
    .populate("student", "name city")
    .sort("-createdAt")
    .limit(3)
    .select("subject level budget teachingMode city schedule createdAt student");

  res.status(200).json({ success: true, requests });
};
