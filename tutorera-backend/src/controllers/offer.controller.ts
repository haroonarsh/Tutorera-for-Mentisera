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
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { escapeHtml } from "../utils/escapeHtml";
import { calculateMatchScore, sortMarketplaceOffers } from "../utils/marketplaceRules";

const ACTIVE_REQUEST_STATES = ["open", "published", "receiving_offers", "negotiating"] as const;
const ACTIVE_OFFER_STATES = ["pending", "submitted", "viewed", "countered"] as const;
const expiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const terminalOfferStates = ["accepted", "rejected", "withdrawn", "expired", "not_selected"];

function moderationReasons(message = "", amount?: number, baseline?: number) {
  const reasons: string[] = [];
  if (containsContactInfo(message)) reasons.push("external_contact");
  if (amount && baseline && (amount < baseline * 0.35 || amount > baseline * 3)) reasons.push("unusual_price");
  return reasons;
}
async function offerEmail(userId: string, subject: string, message: string) { try { const user = await User.findById(userId).select("name email").lean(); if (user?.email) await sendEmail({ to: user.email, subject, html: `<h2>${escapeHtml(subject)}</h2><p>Hello ${escapeHtml(user.name)},</p><p>${escapeHtml(message)}</p><p><a href="https://tutorera.ac.pk/offers">Review your offers</a></p>` }); } catch (error) { console.error("Offer email failed:", error); } }

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
  const session = await mongoose.startSession(); let negotiation: any; let savedOffer: any; let recipient = ""; let role: "student" | "tutor" = "student"; let finalCounterOffer = false;
  try { await session.withTransaction(async () => {
    const offer = await Bid.findById(req.params.id).session(session); if (!offer) throw { statusCode: 404, message: "Offer not found." };
    const request = await Request.findById(offer.request).session(session); if (!request) throw { statusCode: 404, message: "Request not found." };
    if (!(ACTIVE_REQUEST_STATES as readonly string[]).includes(request.status) || !(ACTIVE_OFFER_STATES as readonly string[]).includes(offer.status)) throw { statusCode: 409, message: "Negotiation is closed." };
    if (offer.expiresAt.getTime() <= Date.now()) { offer.status = "expired"; await offer.save({ session }); throw { statusCode: 410, message: "This offer has expired." }; }
    const userId = req.user?._id?.toString(); const isStudent = request.student.toString() === userId; const isTutor = offer.tutor.toString() === userId;
    if (!isStudent && !isTutor) throw { statusCode: 403, message: "Not authorized." };
    if (!request.allowCounterOffers) throw { statusCode: 409, message: "Counter-offers are disabled for this request." };
    role = isStudent ? "student" : "tutor";
    const [roleCount, last] = await Promise.all([OfferNegotiation.countDocuments({ offer: offer._id, senderRole: role, sequenceNumber: { $gt: 1 } }).session(session), OfferNegotiation.findOne({ offer: offer._id }).sort("-sequenceNumber").session(session)]);
    if (roleCount >= 3) throw { statusCode: 409, message: "The maximum of three counter-offers for your side has been reached." };
    if (last?.senderRole === role) throw { statusCode: 409, message: "Wait for the other party to respond." };
    await OfferNegotiation.updateMany({ offer: offer._id, status: "active" }, { status: "superseded" }, { session });
    const expiresAt = expiry(); const reasons = moderationReasons(req.body.message, req.body.amount, offer.initialStudentRate);
    [negotiation] = await OfferNegotiation.create([{ offer: offer._id, senderUser: req.user?._id, senderRole: role, amount: req.body.amount, message: req.body.message, sequenceNumber: (last?.sequenceNumber || 0) + 1, expiresAt, flaggedForModeration: reasons.length > 0 }], { session });
    offer.amount = req.body.amount; offer.status = "countered"; offer.expiresAt = expiresAt; if (reasons.length) { offer.flaggedForModeration = true; offer.moderationReasons = [...new Set([...(offer.moderationReasons || []), ...reasons])]; } await offer.save({ session });
    request.status = "negotiating"; await request.save({ session }); savedOffer = offer; recipient = isStudent ? offer.tutor.toString() : request.student.toString(); finalCounterOffer = roleCount === 2;
  }); } catch (error: any) { if (error?.statusCode === 410) await Bid.updateOne({ _id: req.params.id, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "expired" }); res.status(error.statusCode || (error?.code === 11000 ? 409 : 500)).json({ success: false, message: error?.code === 11000 ? "Another counter-offer was submitted first. Refresh and try again." : error.message || "Unable to send counter offer." }); return; } finally { await session.endSession(); }
  await sendNotification(req.app.get("io"), recipient, { title: "Counter Offer Received", message: `${role === "student" ? "The student" : "The tutor"} proposed PKR ${req.body.amount.toLocaleString()}/${savedOffer.pricingUnit}.`, type: "bid", link: "/offers" });
  await offerEmail(recipient, "Counter Offer Received", `${role === "student" ? "The student" : "The tutor"} proposed PKR ${req.body.amount.toLocaleString()} per ${savedOffer.pricingUnit}.`);
  await logAudit({ action: "offer_countered", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: savedOffer.id, metadata: { amount: req.body.amount, role, sequenceNumber: negotiation.sequenceNumber, flaggedForModeration: negotiation.flaggedForModeration } });
  res.status(201).json({ success: true, message: "Counter offer sent.", offer: savedOffer, negotiation, finalCounterOffer });
};

export const declineOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await context(req.params.id as string); if (!data) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  const userId = req.user?._id?.toString(); const student = data.request.student.toString() === userId; const tutor = data.offer.tutor.toString() === userId;
  if (!student && !tutor) { res.status(403).json({ success: false, message: "Not authorized." }); return; }
  if (terminalOfferStates.includes(data.offer.status)) { res.status(409).json({ success: false, message: "This offer can no longer be changed." }); return; }
  data.offer.status = student ? "rejected" : "withdrawn"; await data.offer.save();
  await OfferNegotiation.updateMany({ offer: data.offer._id, status: "active" }, { status: "declined" });
  await logAudit({ action: student ? "offer_declined" : "offer_withdrawn", actor: req.user?.name, actorId: userId, entity: "Bid", targetId: data.offer.id });
  const recipient = student ? data.offer.tutor.toString() : data.request.student.toString(); await sendNotification(req.app.get("io"), recipient, { title: student ? "Offer Declined" : "Offer Withdrawn", message: student ? "The student declined your tutor offer." : "The tutor withdrew an offer from your request.", type: "bid", link: "/offers" }); await offerEmail(recipient, student ? "Offer Declined" : "Offer Withdrawn", student ? "The student declined your tutor offer." : "The tutor withdrew an offer from your request.");
  res.json({ success: true, message: student ? "Offer declined." : "Offer withdrawn." });
};

export const markOfferViewed = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await context(req.params.id as string); if (!data) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  if (data.request.student.toString() !== req.user?._id?.toString()) { res.status(403).json({ success: false, message: "Not authorized." }); return; }
  if (data.offer.status === "submitted") { data.offer.status = "viewed"; data.offer.viewedAt = new Date(); await data.offer.save(); await Promise.all([sendNotification(req.app.get("io"), data.offer.tutor.toString(), { title: "Offer Viewed", message: "The student viewed your tutor offer.", type: "bid", link: "/offers" }), offerEmail(data.offer.tutor.toString(), "Offer Viewed", "The student viewed your tutor offer."), logAudit({ action: "offer_viewed", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: data.offer.id })]); }
  res.json({ success: true, offer: data.offer });
};

export const renewOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const offer = await Bid.findOne({ _id: req.params.id, tutor: req.user?._id }); if (!offer) { res.status(404).json({ success: false, message: "Offer not found." }); return; }
  const request = await Request.findById(offer.request); if (!request || !(ACTIVE_REQUEST_STATES as readonly string[]).includes(request.status)) { res.status(409).json({ success: false, message: "The request is no longer accepting offers." }); return; }
  if (offer.status !== "expired" && offer.expiresAt.getTime() > Date.now()) { res.status(409).json({ success: false, message: "Only an expired offer can be renewed." }); return; }
  if (!request.allowCounterOffers && req.body.amount !== request.budget) { res.status(409).json({ success: false, message: "This request only accepts the proposed rate." }); return; }
  const last = await OfferNegotiation.findOne({ offer: offer._id }).sort("-sequenceNumber"); const reasons = moderationReasons(req.body.message, req.body.amount, request.budget); const expiresAt = expiry();
  await OfferNegotiation.updateMany({ offer: offer._id, status: "active" }, { status: "expired" });
  await OfferNegotiation.create({ offer: offer._id, senderUser: req.user?._id, senderRole: "tutor", amount: req.body.amount, message: req.body.message, sequenceNumber: (last?.sequenceNumber || 0) + 1, expiresAt, flaggedForModeration: reasons.length > 0 });
  offer.amount = req.body.amount; offer.message = req.body.message || offer.message; offer.availability = req.body.availability || offer.availability; offer.status = "submitted"; offer.expiresAt = expiresAt; offer.renewedAt = new Date(); offer.renewalCount = (offer.renewalCount || 0) + 1; offer.viewedAt = undefined; if (reasons.length) { offer.flaggedForModeration = true; offer.moderationReasons = [...new Set([...(offer.moderationReasons || []), ...reasons])]; } await offer.save();
  await logAudit({ action: "offer_renewed", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: offer.id, metadata: { renewalCount: offer.renewalCount } }); res.json({ success: true, message: "Offer renewed for 24 hours.", offer });
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
    await Promise.all([offerEmail(tutorId, "Offer Accepted", "Your tutor offer was accepted. The booking is awaiting payment."), offerEmail(studentId, "Payment Required", "Your agreed rate is locked. Complete payment to activate the booking.")]);
    await logAudit({ action: "offer_accepted", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Bid", targetId: req.params.id as string, metadata: { bookingId: booking.id, finalAgreedRate: booking.finalAgreedRate } });
    res.json({ success: true, message: "Rate agreed. Complete payment to activate the booking.", booking });
  } catch (error: any) { res.status(error.statusCode || 500).json({ success: false, message: error.message || "Unable to accept offer." }); } finally { await session.endSession(); }
};

export const getRequestOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.requestId, student: req.user?._id }); if (!request) { res.status(404).json({ success: false, message: "Request not found." }); return; }
  await Bid.updateMany({ request: request._id, expiresAt: { $lte: new Date() }, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "expired" });
  const offers = await Bid.find({ request: request._id }).populate("tutor", "name avatar city").lean();
  const enriched = await Promise.all(offers.map(async offer => {
    const tutorId = (offer.tutor as any)._id;
    const [profile, completedSessions, offerStats, counterRows, latestNegotiation] = await Promise.all([
      TutorProfile.findOne({ user: tutorId }).select("education experience subjects levels teachingMode city availability averageRating totalReviews isVerified verificationStatus").lean(),
      Booking.countDocuments({ tutor: tutorId, status: "completed" }),
      Bid.aggregate([{ $match: { tutor: tutorId } }, { $group: { _id: null, total: { $sum: 1 }, responded: { $sum: { $cond: [{ $in: ["$status", ["viewed", "countered", "accepted", "rejected", "not_selected"]] }, 1, 0] } }, averageResponseMs: { $avg: { $subtract: ["$createdAt", "$createdAt"] } } } }]),
      OfferNegotiation.aggregate([{ $match: { offer: offer._id, sequenceNumber: { $gt: 1 } } }, { $group: { _id: "$senderRole", count: { $sum: 1 } } }]),
      OfferNegotiation.findOne({ offer: offer._id }).sort("-sequenceNumber").lean(),
    ]);
    const responseRate = offerStats[0]?.total ? Math.round(offerStats[0].responded / offerStats[0].total * 100) : 0;
    const counterCounts = { student: 0, tutor: 0 };
    counterRows.forEach(row => {
      const key = row._id as "student" | "tutor";
      if (key === "student" || key === "tutor") counterCounts[key] = row.count;
    });
    const requestedDays = request.preferredDays || []; const availableDays = profile?.availability?.map(a => a.day) || [];
    const {score:matchScore,breakdown}=calculateMatchScore({subject:!!profile?.subjects?.some(s=>s.toLowerCase()===request.subject.toLowerCase()),academicLevel:!!profile?.levels?.includes(request.level as any),availability:requestedDays.length>0&&requestedDays.every(day=>availableDays.includes(day)),location:request.teachingMode==="online"||!!(request.city&&profile?.city?.toLowerCase()===request.city.toLowerCase()),teachingMode:!!profile&&(profile.teachingMode==="both"||request.teachingMode==="both"||profile.teachingMode===request.teachingMode),withinPreferredBudget:offer.amount<=request.budget,rating:profile?.averageRating,experience:profile?.experience,responseRate});
    const created = new Date((offer as any).createdAt).getTime(); const responseSeconds = Math.max(0, Math.round((created - request.createdAt.getTime()) / 1000));
    return { ...offer, profile, completedSessions, responseRate, responseSeconds, matchScore, matchScoreBreakdown: breakdown, counterCounts, latestSenderRole: latestNegotiation?.senderRole };
  }));
  const sort = String(req.query.sort || "best_match");
  const sorted=sortMarketplaceOffers(enriched,sort);
  res.json({ success: true, total: sorted.length, sort, request, offers: sorted });
};

export const getMyOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  await Bid.updateMany({ expiresAt: { $lte: new Date() }, status: { $in: [...ACTIVE_OFFER_STATES] } }, { status: "expired" });
  const filter = req.user?.role === "tutor" ? { tutor: userId } : { request: { $in: (await Request.find({ student: userId }).select("_id").lean()).map(item => item._id) } };
  const offers = await Bid.find(filter).populate("tutor", "name avatar city").populate("request", "subject level budget pricingUnit teachingMode city area schedule status allowCounterOffers student").sort("-updatedAt").lean();
  const result = await Promise.all(offers.map(async offer => ({ ...offer, history: await OfferNegotiation.find({ offer: offer._id }).sort("sequenceNumber").lean() })));
  res.json({ success: true, offers: result });
};
