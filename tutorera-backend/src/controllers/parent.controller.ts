import { Response } from "express";
import { AuthRequest } from "../types";
import ParentProfile from "../models/ParentProfile.model";
import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import Booking from "../models/Booking.model";
import { advanceAccountStatus } from "../services/accountLifecycle.service";
import ParentLinkRequest from "../models/ParentLinkRequest.model";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import mongoose from "mongoose";
import { escapeHtml } from "../utils/escapeHtml";
import { logAudit } from "../utils/logAudit";
import { resolveMarket } from "../services/market.service";
import { resolveLocationReferences } from "../services/locationReference.service";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import { paymentProvider } from "../services/paymentProvider.service";

const LINK_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_LINK_ATTEMPTS = 5;
const PAYMENT_HOLD_MS = 30 * 60 * 1000;

function linkCodeHash(code: string) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "parent-link-fallback")
    .update(code)
    .digest("hex");
}

export const getMyParentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  let profile = await ParentProfile.findOne({ user: req.user._id }).lean();

  if (!profile) {
    profile = await ParentProfile.create({ user: req.user._id, children: [] });
  }

  const childUserIds = (profile as any).children.map((c: any) => c.studentUser);

  const childBookings = childUserIds.length > 0
    ? await Booking.find({ student: { $in: childUserIds } })
        .populate("tutor", "name")
        .populate("request", "subject")
        .sort("-createdAt")
        .limit(20)
        .lean()
    : [];

  const childProfiles = await StudentProfile.find({ user: { $in: childUserIds } }).lean();
  const childMap: Record<string, any> = {};
  for (const cp of childProfiles) childMap[cp.user.toString()] = cp;
  const pendingApprovals = childUserIds.length ? await Request.find({ student: { $in: childUserIds }, status: "awaiting_parent_approval" })
    .populate("acceptedOffer", "amount currency pricingUnit tutor")
    .populate("student", "name")
    .sort("-updatedAt").lean() : [];

  res.status(200).json({
    success: true,
    profile: {
      ...profile,
      children: (profile as any).children.map((c: any) => ({
        ...c,
        studentProfile: childMap[c.studentUser?.toString()] || null,
      })),
    },
    recentBookings: childBookings.map((b: any) => ({
      _id: b._id,
      studentName: (b.student as any)?.name || "Student",
      tutorName: (b.tutor as any)?.name || "Tutor",
      subject: (b.request as any)?.subject || "Tutoring",
      amount: b.amount,
      currency: b.currency || (b.request as any)?.currency || profile.currency || "PKR",
      status: b.status,
      teachingMode: b.teachingMode,
      createdAt: b.createdAt,
    })),
    pendingLinkRequests: await ParentLinkRequest.find({
      parent: req.user._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).select("student name relationship expiresAt createdAt").sort("-createdAt").lean(),
    pendingApprovals: pendingApprovals.map((item: any) => ({
      _id: item._id, subject: item.subject, studentName: item.student?.name || "Student", currency: item.currency,
      offer: item.acceptedOffer ? { amount: item.acceptedOffer.amount, currency: item.acceptedOffer.currency, pricingUnit: item.acceptedOffer.pricingUnit } : null,
      updatedAt: item.updatedAt,
    })),
  });
};

export const addChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { studentEmail, name, level, subjects, relationship } = req.body;

  if (!studentEmail || !name) {
    res.status(400).json({ success: false, message: "Student email and name are required." });
    return;
  }

  const normalizedEmail = String(studentEmail).trim().toLowerCase();
  const student = await User.findOne({ email: normalizedEmail });
  if (!student || student.role !== "student") {
    res.status(404).json({ success: false, message: "Student account not found." });
    return;
  }

  let profile = await ParentProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ParentProfile.create({ user: req.user._id, children: [] });
  }

  const alreadyLinked = profile.children.some(
    (c) => c.studentUser?.toString() === student._id.toString()
  );
  if (alreadyLinked) {
    res.status(409).json({ success: false, message: "This student account is already linked." });
    return;
  }

  await ParentLinkRequest.updateMany(
    { parent: req.user._id, student: student._id, status: "pending" },
    { status: "cancelled" }
  );

  const code = crypto.randomInt(100000, 1000000).toString();
  const linkRequest = await ParentLinkRequest.create({
    parent: req.user._id,
    student: student._id,
    codeHash: linkCodeHash(code),
    name: String(name).trim().slice(0, 100),
    level: String(level || "").trim().slice(0, 100),
    subjects: Array.isArray(subjects) ? subjects.map((item) => String(item).trim()).filter(Boolean).slice(0, 12) : [],
    relationship: ["child", "sibling", "other"].includes(relationship) ? relationship : "child",
    expiresAt: new Date(Date.now() + LINK_CODE_TTL_MS),
  });

  try {
    await sendEmail({
      to: student.email,
      userId: student._id.toString(),
      eventType: "account.parent_link_verification_requested",
      templateId: "parent_link_verification_code",
      relatedEntityType: "ParentLinkRequest",
      relatedEntityId: linkRequest._id.toString(),
      subject: "TUTORERA® — Confirm parent account access",
      preheader: "Use this code only if you approve parent access to your tutoring account.",
      html: `<h2>Confirm parent account access</h2><p>Hello ${escapeHtml(student.name)},</p><p>A parent account requested access to view and manage your TUTORERA tutoring activity.</p><p style="font-size:28px;font-weight:800;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes. Share it only if you approve this access. If you did not expect this request, do not share the code.</p>`,
    });
  } catch (error) {
    await ParentLinkRequest.findByIdAndUpdate(linkRequest._id, { status: "cancelled" });
    throw error;
  }

  await logAudit({
    action: "parent_student_link_requested",
    actor: req.user.name,
    actorId: req.user._id.toString(),
    entity: "ParentLinkRequest",
    targetId: linkRequest._id.toString(),
    targetName: student.name,
    metadata: { studentId: student._id.toString(), relationship: linkRequest.relationship, expiresAt: linkRequest.expiresAt.toISOString() },
  });

  res.status(202).json({ success: true, message: "A verification code was sent to the student.", requestId: linkRequest._id, expiresInSeconds: LINK_CODE_TTL_MS / 1000 });
};

export const confirmChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { requestId, code } = req.body;
  if (!mongoose.isValidObjectId(requestId) || !/^\d{6}$/.test(String(code || ""))) {
    res.status(400).json({ success: false, message: "A valid request and six-digit code are required." });
    return;
  }

  const linkRequest = await ParentLinkRequest.findOne({
    _id: requestId,
    parent: req.user._id,
    status: "pending",
  }).select("+codeHash");

  if (!linkRequest || linkRequest.expiresAt <= new Date() || linkRequest.attempts >= MAX_LINK_ATTEMPTS) {
    res.status(410).json({ success: false, message: "This verification request has expired. Request a new code." });
    return;
  }

  const suppliedHash = linkCodeHash(String(code));
  const matches = crypto.timingSafeEqual(Buffer.from(linkRequest.codeHash, "hex"), Buffer.from(suppliedHash, "hex"));
  if (!matches) {
    linkRequest.attempts += 1;
    await linkRequest.save();
    res.status(400).json({ success: false, message: "The verification code is incorrect.", attemptsRemaining: Math.max(0, MAX_LINK_ATTEMPTS - linkRequest.attempts) });
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const profile = await ParentProfile.findOneAndUpdate(
        { user: req.user?._id, "children.studentUser": { $ne: linkRequest.student } },
        { $push: { children: { studentUser: linkRequest.student, name: linkRequest.name, level: linkRequest.level, subjects: linkRequest.subjects, relationship: linkRequest.relationship } } },
        { new: true, upsert: true, session }
      );
      if (!profile) throw Object.assign(new Error("This student account is already linked."), { statusCode: 409 });
      linkRequest.status = "confirmed";
      linkRequest.confirmedAt = new Date();
      await linkRequest.save({ session });
      await User.findByIdAndUpdate(linkRequest.student, {
        $set: {
          parentConsentVerified: true,
          parentGuardianEmail: req.user?.email || "",
          parentGuardianName: req.user?.name || "",
        },
      }, { session });
      await User.findByIdAndUpdate(req.user?._id, { $addToSet: { children: linkRequest.student } }, { session });
    });
  } finally {
    await session.endSession();
  }

  await logAudit({
    action: "parent_student_link_confirmed",
    actor: req.user.name,
    actorId: req.user._id.toString(),
    entity: "ParentLinkRequest",
    targetId: linkRequest._id.toString(),
    targetName: linkRequest.name,
    metadata: { studentId: linkRequest.student.toString(), confirmedAt: linkRequest.confirmedAt?.toISOString() },
  });

  res.status(200).json({ success: true, message: "Student consent confirmed. The account is now linked." });
};

export const removeChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { childId } = req.params;

  const profile = await ParentProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404).json({ success: false, message: "Parent profile not found." });
    return;
  }

  const childEntry = profile.children.find((c) => c._id?.toString() === childId);
  const before = profile.children.length;
  profile.children = profile.children.filter(
    (c) => c._id?.toString() !== childId
  );

  if (profile.children.length === before) {
    res.status(404).json({ success: false, message: "Child account not found." });
    return;
  }

  await profile.save();

  const child = await User.findByIdAndUpdate(
    childEntry?.studentUser,
    { $set: { parentConsentVerified: false, parentGuardianEmail: "", parentGuardianName: "" } },
    { new: true }
  );
  await User.findByIdAndUpdate(req.user._id, { $pull: { children: child?._id } });
  await logAudit({
    action: "parent_student_link_removed",
    actor: req.user.name,
    actorId: req.user._id.toString(),
    entity: "ParentProfile",
    targetId: profile._id.toString(),
    targetName: child?.name,
    metadata: { studentId: child?._id?.toString() },
  });

  res.status(200).json({ success: true, message: "Child account removed." });
};

// @desc    Cancel a pending parent/student consent request
// @route   DELETE /api/parent/children/requests/:requestId
// @access  Private (parent)
export const cancelChildLinkRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.requestId)) {
    res.status(400).json({ success: false, message: "Invalid consent request." });
    return;
  }
  const linkRequest = await ParentLinkRequest.findOneAndUpdate(
    { _id: req.params.requestId, parent: req.user._id, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true }
  );
  if (!linkRequest) {
    res.status(404).json({ success: false, message: "No pending consent request was found." });
    return;
  }
  await logAudit({ action: "parent_student_link_cancelled", actor: req.user.name, actorId: req.user._id.toString(), entity: "ParentLinkRequest", targetId: linkRequest._id.toString(), targetName: linkRequest.name, metadata: { studentId: linkRequest.student.toString() } });
  res.status(200).json({ success: true, message: "Consent request cancelled." });
};

export const decideBookingApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") { res.status(403).json({ success: false, message: "Access denied." }); return; }
  const request = await Request.findOne({ _id: req.params.requestId, status: "awaiting_parent_approval" });
  if (!request || !request.acceptedOffer) { res.status(404).json({ success: false, message: "No pending booking approval was found." }); return; }
  const linked = await ParentProfile.exists({ user: req.user._id, "children.studentUser": request.student, approvalRequiredForBookings: true });
  if (!linked) { res.status(403).json({ success: false, message: "You are not authorized for this learner." }); return; }
  if (req.body?.decision === "decline") {
    await Request.updateOne({ _id: request._id, status: "awaiting_parent_approval" }, { $set: { status: "open" }, $unset: { acceptedOffer: "", finalAgreedRate: "" } });
    await logAudit({ action: "parent_booking_approval_declined", actor: req.user.name, actorId: req.user._id.toString(), entity: "Request", targetId: request._id.toString() });
    res.json({ success: true, message: "Approval declined. The request is open for the student to review offers again." }); return;
  }
  const bid = await Bid.findOne({ _id: request.acceptedOffer, request: request._id, status: { $in: ["submitted", "viewed", "countered", "pending"] } });
  if (!bid || (bid.expiresAt && bid.expiresAt <= new Date())) { res.status(410).json({ success: false, message: "The selected offer is no longer available." }); return; }
  const expiry = new Date(Date.now() + PAYMENT_HOLD_MS);
  const reserved = await Request.findOneAndUpdate({ _id: request._id, status: "awaiting_parent_approval" }, { status: "awaiting_payment" }, { new: true });
  if (!reserved) { res.status(409).json({ success: false, message: "This approval was already processed." }); return; }
  await Bid.updateOne({ _id: bid._id }, { status: "payment_pending", paymentPendingExpiresAt: expiry });
  const student = await User.findById(request.student).select("email phone");
  let checkoutUrl: string;
  try {
    checkoutUrl = await paymentProvider.createCheckout({ amount: bid.amount, currency: bid.currency || request.currency || "PKR", customerMobileNo: student?.phone || "03000000000", customerEmail: student?.email || "", basketId: `BID-${bid._id}`, bidId: bid._id.toString(), studentId: request.student.toString(), tutorId: bid.tutor.toString(), description: `TUTORERA offer approval ${bid._id}`, successUrl: `${process.env.CLIENT_URL}/dashboard?payment=success&bid=${bid._id}`, failureUrl: `${process.env.CLIENT_URL}/dashboard?payment=failed&bid=${bid._id}`, checkoutUrl: `${process.env.CLIENT_URL}/dashboard?payment=processing&bid=${bid._id}` });
  } catch {
    await Promise.all([Request.updateOne({ _id: request._id, status: "awaiting_payment" }, { status: "awaiting_parent_approval" }), Bid.updateOne({ _id: bid._id, status: "payment_pending" }, { status: bid.status, $unset: { paymentPendingExpiresAt: "" } })]);
    await logAudit({ action: "parent_booking_checkout_failed", actor: req.user.name, actorId: req.user._id.toString(), entity: "Request", targetId: request._id.toString(), metadata: { offerId: bid._id.toString() } });
    res.status(502).json({ success: false, message: "Unable to start payment. The approval is still awaiting your action." }); return;
  }
  await logAudit({ action: "parent_booking_approval_approved", actor: req.user.name, actorId: req.user._id.toString(), entity: "Request", targetId: request._id.toString(), metadata: { offerId: bid._id.toString() } });
  res.json({ success: true, message: "Approved. Continue to secure payment.", checkoutUrl });
};

export const updateParentSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { approvalRequiredForBookings, spendingLimitMonthly, notificationsEnabled } = req.body;

  const profile = await ParentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        ...(approvalRequiredForBookings !== undefined && { approvalRequiredForBookings }),
        ...(spendingLimitMonthly !== undefined && { spendingLimitMonthly }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
    },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, profile });
};

// @desc    Save parent onboarding
// @route   POST /api/parent/onboarding
// @access  Private (parent)
export const saveParentOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const {
    name, phone, city, approvalRequiredForBookings, spendingLimitMonthly, notificationsEnabled,
    countryCode, country, region, cityRef, locality, timezone, preferredLanguage,
  } = req.body;

  const market = await resolveMarket(countryCode || req.user?.countryCode || "PK");
  if (!market || !market.isActive || !market.studentRegistration) {
    res.status(422).json({ success: false, code: "MARKET_UNAVAILABLE", message: "Parent onboarding is not available in the selected market." });
    return;
  }

  let locationReferences: Record<string, unknown>;
  try {
    locationReferences = await resolveLocationReferences({ country, region, cityRef, locality, city }, market.countryCode);
  } catch (error: any) {
    res.status(422).json({ success: false, code: "INVALID_LOCATION_REFERENCE", message: error.message });
    return;
  }
  const resolvedCity = (locationReferences.city as string | undefined) || city || req.user?.city || "";
  const resolvedTimezone = timezone || (locationReferences.timezone as string | undefined) || market.timezone;
  const resolvedLanguage = typeof preferredLanguage === "string" && preferredLanguage.trim()
    ? preferredLanguage.trim().toLowerCase().slice(0, 12)
    : "en";

  await User.findByIdAndUpdate(req.user._id, {
    name: name || req.user.name,
    phone: phone || req.user.phone,
    city: resolvedCity,
    countryCode: market.countryCode,
    countryName: market.countryName,
    timezone: resolvedTimezone,
    currency: market.currency,
    ...locationReferences,
  });

  const profile = await ParentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        ...(approvalRequiredForBookings !== undefined && { approvalRequiredForBookings }),
        ...(spendingLimitMonthly !== undefined && { spendingLimitMonthly }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
        countryCode: market.countryCode,
        countryName: market.countryName,
        city: resolvedCity,
        timezone: resolvedTimezone,
        currency: market.currency,
        preferredLanguage: resolvedLanguage,
        ...locationReferences,
      },
    },
    { new: true, upsert: true }
  );

  await advanceAccountStatus(req.user._id.toString(), "profile_complete");

  res.status(200).json({
    success: true,
    message: "Parent onboarding completed successfully",
    profile,
  });
};
