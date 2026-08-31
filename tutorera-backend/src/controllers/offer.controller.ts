import mongoose, { Types } from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../types";
import Bid from "../models/Bid.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import OfferNegotiation from "../models/OfferNegotiation.model";
import TutorProfile from "../models/TutorProfile.model";
import { calculateMarketplaceFees } from "../config/constants";
import { containsContactInfo } from "../utils/contentFilter";
import { sendNotification } from "../utils/socket";
import { logAudit } from "../utils/logAudit";

const ACTIVE_REQUEST_STATES = ["open", "published", "receiving_offers", "negotiating"] as const;
const ACTIVE_OFFER_STATES = ["pending", "submitted", "viewed", "countered"] as const;
const expiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

async function context(offerId: string) {
  const offer = await Bid.findById(offerId);
  if (!offer) return null;
  const request = await Request.findById(offer.request);
  return request ? { offer, request } : null;
}

export const getOfferHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await context(req.params.id as string);
  if (!data) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  const userId = req.user?._id?.toString();
  if (data.request.student.toString() !== userId && data.offer.tutor.toString() !== userId && req.user?.role !== "admin") { res.status(403).json({ success: false, message: "Not authorized." }); return; }
  const history = await OfferNegotiation.find({ offer: data.offer._id }).sort("sequenceNumber");
  res.json({ success: true, offer: data.offer, history, finalAgreedRate: data.request.finalAgreedRate });
};

export const counterOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await context(req.params.id as string);
  if (!data) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  if (!(ACTIVE_REQUEST_STATES as readonly string[]).includes(data.request.status) || !(ACTIVE_OFFER_STATES as readonly string[]).includes(data.offer.status)) { res.status(409).json({ success: false, message: "Negotiation is closed." }); return; }
  if (data.offer.expiresAt && data.offer.expiresAt.getTime() <= Date.now()) { await Bid.updateOne({ _id: data.offer._id }, { status: "expired" }); res.status(410).json({ success: false, message: "This offer has expired." }); return; }
  const userId = req.user?._id?.toString(); const isStudent = data.request.student.toString() === userId; const isTutor = data.offer.tutor.toString() === userId;
  if (!isStudent && !isTutor) { res.status(403).json({ success: false, message: "Not authorized." }); return; }
  if (isStudent && !data.request.allowCounterOffers) { res.status(409).json({ success: false, message: "Counter-offers are disabled for this request." }); return; }
  const role = isStudent ? "student" : "tutor";
  const roleCount = await OfferNegotiation.countDocuments({ offer: data.offer._id, senderRole: role });
  if (roleCount >= 3) { res.status(409).json({ success: false, message: "The maximum of three counter-offers for your side has been reached." }); return; }
  const last = await OfferNegotiation.findOne({ offer: data.offer._id }).sort("-sequenceNumber");
  if (last?.senderRole === role) { res.status(409).json({ success: false, message: "Wait for the other party to respond." }); return; }
  await OfferNegotiation.updateMany({ offer: data.offer._id, status: "active" }, { status: "superseded" });
  const expiresAt = expiry();
  const negotiation = await OfferNegotiation.create({ offer: data.offer._id, senderUser: req.user?._id, senderRole: role, amount: req.body.amount, message: req.body.message, sequenceNumber: (last?.sequenceNumber || 0) + 1, expiresAt, flaggedForModeration: containsContactInfo(req.body.message || "") });
  data.offer.amount = req.body.amount; data.offer.status = "countered"; data.offer.expiresAt = expiresAt; await data.offer.save();
  data.request.status = "negotiating"; await data.request.save();
  const recipient = isStudent ? data.offer.tutor.toString() : data.request.student.toString();
  await sendNotification(req.app.get("io"), recipient, { title: "Counter Offer Received", message: `${role === "student" ? "The student" : "The tutor"} proposed PKR ${req.body.amount.toLocaleString()}/${data.offer.pricingUnit}.`, type: "bid", link: "/dashboard" });
  await logAudit({ action: "offer_countered", actor: req.user?.name, actorId: userId, entity: "Bid", targetId: data.offer.id, metadata: { amount: req.body.amount, role, sequenceNumber: negotiation.sequenceNumber, flaggedForModeration: negotiation.flaggedForModeration } });
  res.status(201).json({ success: true, message: "Counter offer sent.", offer: data.offer, negotiation, finalCounterOffer: roleCount === 2 });
};

export const declineOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await context(req.params.id as string); if (!data) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  const userId = req.user?._id?.toString(); const student = data.request.student.toString() === userId; const tutor = data.offer.tutor.toString() === userId;
  if (!student && !tutor) { res.status(403).json({ success: false, message: "Not authorized." }); return; }
  data.offer.status = student ? "rejected" : "withdrawn"; await data.offer.save();
  await OfferNegotiation.updateMany({ offer: data.offer._id, status: "active" }, { status: "declined" });
  await logAudit({ action: student ? "offer_declined" : "offer_withdrawn", actor: req.user?.name, actorId: userId, entity: "Bid", targetId: data.offer.id });
  res.json({ success: true, message: student ? "Offer declined." : "Offer withdrawn." });
};

export const acceptOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession(); let booking: any; let tutorId = ""; let studentId = "";
  try {
    await session.withTransaction(async () => {
      const offer = await Bid.findById(new Types.ObjectId(req.params.id as string)).session(session); if (!offer) throw { statusCode: 404, message: "Offer not found." };
      const request = await Request.findOne({ _id: offer.request, status: { $in: [...ACTIVE_REQUEST_STATES] } }).session(session);
      if (!request) throw { statusCode: 409, message: "This request has already been matched with another tutor." };
      const userId = req.user?._id?.toString();
      const isStudentOwner = request.student.toString() === userId;
      const isTutorOwner = offer.tutor.toString() === userId;
      const latestNegotiation = await OfferNegotiation.findOne({ offer: offer._id }).sort("-sequenceNumber").session(session);
      if (!isStudentOwner && !(isTutorOwner && latestNegotiation?.senderRole === "student")) throw { statusCode: 403, message: "Only the student can accept a tutor offer, or the tutor can accept the student's latest counter." };
      if (!(ACTIVE_OFFER_STATES as readonly string[]).includes(offer.status) || (offer.expiresAt && offer.expiresAt.getTime() <= Date.now())) throw { statusCode: 410, message: "This offer is no longer available." };
      const locked = await Request.updateOne({ _id: request._id, status: { $in: [...ACTIVE_REQUEST_STATES] } }, { status: "awaiting_payment", acceptedOffer: offer._id, finalAgreedRate: offer.amount }, { session });
      if (locked.modifiedCount !== 1) throw { statusCode: 409, message: "This request has already been matched with another tutor." };
      offer.status = "accepted"; await offer.save({ session });
      await Bid.updateMany({ request: request._id, _id: { $ne: offer._id }, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "not_selected" }, { session });
      await OfferNegotiation.updateMany({ offer: offer._id, status: "active" }, { status: "accepted" }, { session });
      const fees = calculateMarketplaceFees(offer.amount); const first = await Booking.countDocuments({ student: request.student, tutor: offer.tutor }).session(session) === 0;
      [booking] = await Booking.create([{ student: request.student, tutor: offer.tutor, request: request._id, bid: offer._id, amount: offer.amount, finalAgreedRate: offer.amount, pricingUnit: offer.pricingUnit, sessionCount: 1, ...fees, platformFee: fees.tutorFee + fees.tax, tutorPayout: fees.tutorNet, schedule: request.schedule, teachingMode: request.teachingMode, isFirstSession: first }], { session });
      tutorId = offer.tutor.toString(); studentId = request.student.toString();
    });
    await Promise.all([sendNotification(req.app.get("io"), tutorId, { title: "Offer Accepted", message: "Your offer was accepted. The booking is awaiting payment.", type: "booking", link: "/dashboard" }), sendNotification(req.app.get("io"), studentId, { title: "Payment Required", message: "Your agreed rate is locked. Complete payment to activate the booking.", type: "booking", link: "/dashboard" })]);
    await logAudit({ action: "offer_accepted", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: req.params.id as string, metadata: { bookingId: booking.id, finalAgreedRate: booking.finalAgreedRate } });
    res.json({ success: true, message: "Rate agreed. Complete payment to activate the booking.", booking });
  } catch (error: any) { res.status(error.statusCode || 500).json({ success: false, message: error.message || "Unable to accept offer." }); } finally { await session.endSession(); }
};

export const getRequestOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.requestId, student: req.user?._id }); if (!request) { res.status(404).json({ success: false, message: "Request not found." }); return; }
  await Bid.updateMany({ request: request._id, expiresAt: { $lte: new Date() }, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "expired" });
  const offers = await Bid.find({ request: request._id }).populate("tutor", "name avatar city").sort("-createdAt").lean();
  const enriched = await Promise.all(offers.map(async offer => { const tutorId = (offer.tutor as any)._id; const profile = await TutorProfile.findOne({ user: tutorId }).select("education experience subjects levels teachingMode city averageRating totalReviews isVerified verificationStatus").lean(); const completedSessions = await Booking.countDocuments({ tutor: tutorId, status: "completed" }); const score = Math.min(100, (profile?.subjects?.some(s => s.toLowerCase() === request.subject.toLowerCase()) ? 25 : 0) + (profile?.levels?.includes(request.level as any) ? 15 : 0) + (profile?.city?.toLowerCase() === request.city?.toLowerCase() ? 10 : 0) + (profile?.teachingMode === "both" || profile?.teachingMode === request.teachingMode ? 10 : 0) + (offer.amount <= request.budget ? 10 : 5) + Math.min(5, profile?.averageRating || 0) + Math.min(5, (profile?.experience || 0) / 2) + 20); return { ...offer, profile, completedSessions, matchScore: Math.round(score) }; }));
  res.json({ success: true, total: enriched.length, request, offers: enriched });
};

export const getMyOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  await Bid.updateMany({ expiresAt: { $lte: new Date() }, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "expired" });
  const filter = req.user?.role === "tutor" ? { tutor: userId } : { request: { $in: (await Request.find({ student: userId }).select("_id").lean()).map(item => item._id) } };
  const offers = await Bid.find(filter).populate("tutor", "name avatar city").populate("request", "subject level budget pricingUnit teachingMode city area schedule status allowCounterOffers student").sort("-updatedAt").lean();
  const result = await Promise.all(offers.map(async offer => ({ ...offer, history: await OfferNegotiation.find({ offer: offer._id }).sort("sequenceNumber").lean() })));
  res.json({ success: true, offers: result });
};
