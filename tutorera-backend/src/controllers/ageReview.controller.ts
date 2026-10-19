import { Response } from "express";
import { AuthRequest } from "../types";
import AgeReviewRequest from "../models/AgeReviewRequest.model";
import { logAudit } from "../utils/logAudit";

// Intake only: no DOB updates, uploads, automatic age classification, or consent grants.
export const requestAgeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== "student") {
    res.status(403).json({ success: false, code: "STUDENT_ACCOUNT_REQUIRED" }); return;
  }
  const reason = req.body?.reason;
  // Only intake a category: no proposed guardian email, DOB or documents accepted.
  if (reason !== "missing_date_of_birth" && reason !== "incorrect_date_of_birth" &&
      reason !== "guardian_contact_recovery") {
    res.status(400).json({ success: false, code: "INVALID_AGE_REVIEW_REASON" }); return;
  }
  const existing = await AgeReviewRequest.findOne({ student: user._id, status: { $in: ["pending", "in_review"] } });
  if (existing) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ success: true, status: existing.status, requestId: existing._id }); return;
  }
  let review;
  try {
    review = await AgeReviewRequest.create({ student: user._id, reason, status: "pending" });
  } catch (error: unknown) {
    // Another concurrent request may have created the unique pending case.
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      const pending = await AgeReviewRequest.findOne({ student: user._id, status: { $in: ["pending", "in_review"] } });
      if (pending) {
        res.setHeader("Cache-Control", "no-store");
        res.status(200).json({ success: true, status: pending.status, requestId: pending._id });
        return;
      }
    }
    throw error;
  }
  await logAudit({ action: "student_age_review_requested", actorId: user._id.toString(),
    actor: "Student", entity: "AgeReviewRequest", targetId: review._id.toString(),
    metadata: { reason } });
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ success: true, status: "pending", requestId: review._id,
    message: "Your request has been recorded. Support will explain secure verification steps." });
};

export const getMyAgeReviewRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "student") {
    res.status(403).json({ success: false, code: "STUDENT_ACCOUNT_REQUIRED" }); return;
  }
  const review = await AgeReviewRequest.findOne({ student: req.user._id }).sort({ createdAt: -1 })
    .select("status reason resolution createdAt updatedAt reviewedAt").lean();
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, review: review || null });
};

export const listPendingAgeReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const rawLimit = Number(req.query.limit ?? 25);
  const rawPage = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(rawLimit) || rawLimit < 1 || rawLimit > 50 ||
      !Number.isSafeInteger(rawPage) || rawPage < 1 || rawPage > 100000) {
    res.status(400).json({ success: false, code: "INVALID_PAGINATION" }); return;
  }
  const filter = { status: { $in: ["pending", "in_review"] as const } };
  const [total, reviews] = await Promise.all([
    AgeReviewRequest.countDocuments(filter),
    AgeReviewRequest.find(filter).sort({ createdAt: 1, _id: 1 })
      .skip((rawPage - 1) * rawLimit).limit(rawLimit)
      .select("student reason status createdAt assignedTo assignedAt").lean(),
  ]);
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, reviews, pagination: {
    page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit),
  } });
};

// Administrative triage closes an intake case; it is not proof of identity,
// age, adulthood, legal guardianship or permission to access tutoring.
// A separate reviewed verification service must control those changes.
export const closeAgeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    res.status(400).json({ success: false, code: "INVALID_REVIEW_ID" }); return;
  }
  if (req.body?.resolution !== "referred_to_support" && req.body?.resolution !== "duplicate_request") {
    res.status(400).json({ success: false, code: "INVALID_REVIEW_RESOLUTION" }); return;
  }
  // Only the assigned reviewer may close a claimed case. Unclaimed cases
  // can still be triaged by safety.resolve staff.
  const closed = await AgeReviewRequest.findOneAndUpdate(
    { _id: id, $or: [{ status: "pending" },
      { status: "in_review", assignedTo: req.user?._id }] },
    { $set: { status: "closed", resolution: req.body.resolution,
      reviewedBy: req.user?._id, reviewedAt: new Date() } }, { new: true });
  if (!closed) {
    res.status(409).json({ success: false, code: "REVIEW_ALREADY_CLOSED_OR_MISSING" }); return;
  }
  await logAudit({ action: "student_age_review_triaged", actor: req.user?.name || "Admin",
    actorId: req.user?._id.toString(), entity: "AgeReviewRequest",
    targetId: closed._id.toString(), metadata: { resolution: req.body.resolution } });
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, status: "closed" });
};


// Assign an active case to the authenticated safety reviewer. This is a
// workflow step only: it never modifies student DOB or guardian consent.
export const claimAgeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    res.status(400).json({ success: false, code: "INVALID_REVIEW_ID" }); return;
  }
  if (!req.user) { res.status(403).json({ success: false }); return; }
  const assigned = await AgeReviewRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "in_review", assignedTo: req.user._id, assignedAt: new Date() } },
    { new: true },
  );
  if (!assigned) {
    res.status(409).json({ success: false, code: "REVIEW_NOT_PENDING" }); return;
  }
  await logAudit({ action: "student_age_review_claimed", actor: req.user.name || "Admin",
    actorId: req.user._id.toString(), entity: "AgeReviewRequest",
    targetId: assigned._id.toString() });
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, status: "in_review", reviewId: assigned._id });
};


// Only the platform super-admin can transfer ownership of an already claimed
// review. This does not determine the student's age or alter consent.
export const reassignAgeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const reviewerId = req.body?.reviewerId;
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id) ||
      typeof reviewerId !== "string" || !/^[a-fA-F0-9]{24}$/.test(reviewerId)) {
    res.status(400).json({ success: false, code: "INVALID_REASSIGNMENT" }); return;
  }
  if (req.user?.adminRole !== "super_admin") {
    res.status(403).json({ success: false, code: "SUPERVISOR_REQUIRED" }); return;
  }
  const User = (await import("../models/User.model")).default;
  const reviewer = await User.findOne({ _id: reviewerId, role: "admin", isActive: true });
  if (!reviewer || !["super_admin", "trust_and_safety"].includes(reviewer.adminRole || "")) {
    res.status(400).json({ success: false, code: "INELIGIBLE_REVIEWER" }); return;
  }
  const original = await AgeReviewRequest.findOne({ _id: id, status: "in_review" });
  if (!original) {
    res.status(409).json({ success: false, code: "REVIEW_NOT_IN_PROGRESS" }); return;
  }
  const oldReviewer = original.assignedTo?.toString();
  const updated = await AgeReviewRequest.findOneAndUpdate(
    { _id: id, status: "in_review", assignedTo: original.assignedTo },
    { $set: { assignedTo: reviewer._id, assignedAt: new Date() } }, { new: true });
  if (!updated) {
    res.status(409).json({ success: false, code: "REVIEW_REASSIGNMENT_CONFLICT" }); return;
  }
  await logAudit({ action: "student_age_review_reassigned", actor: req.user.name || "Super Admin",
    actorId: req.user._id.toString(), entity: "AgeReviewRequest",
    targetId: updated._id.toString(), metadata: { previousReviewerId: oldReviewer, newReviewerId: reviewer._id.toString() } });
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, status: "in_review", assignedTo: reviewer._id });
};


// Two-person verified age correction. Evidence remains in the controlled
// verification system; only its opaque reference is stored here.
export const proposeVerifiedDob = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const { dateOfBirth, evidenceReference } = req.body || {};
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id) ||
      typeof dateOfBirth !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dateOfBirth) ||
      typeof evidenceReference !== "string" || !/^[A-Za-z0-9_-]{8,120}$/.test(evidenceReference)) {
    res.status(400).json({ success: false, code: "INVALID_VERIFICATION_PROPOSAL" }); return;
  }
  const date = new Date(dateOfBirth + "T00:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateOfBirth ||
      date.getTime() > Date.now() || date.getUTCFullYear() < 1900) {
    res.status(400).json({ success: false, code: "INVALID_DATE_OF_BIRTH" }); return;
  }
  const updated = await AgeReviewRequest.findOneAndUpdate(
    { _id: id, status: "in_review", assignedTo: req.user?._id,
      reason: { $in: ["missing_date_of_birth", "incorrect_date_of_birth"] } },
    { $set: { verifiedDateOfBirth: date, evidenceReference,
      evidenceCheckedBy: req.user?._id, evidenceCheckedAt: new Date() } },
    { new: true });
  if (!updated) { res.status(409).json({ success: false, code: "REVIEW_NOT_ASSIGNED" }); return; }
  await logAudit({ action: "student_dob_evidence_checked", actor: req.user?.name || "Reviewer",
    actorId: req.user?._id.toString(), entity: "AgeReviewRequest",
    targetId: updated._id.toString(), metadata: { evidenceReference } });
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, status: "awaiting_independent_approval" });
};

// Only a separate super-admin can approve a recorded evidence review.
// Correcting a DOB always revokes prior guardian consent so it cannot
// accidentally preserve or grant privileges across an age transition.
export const approveVerifiedDob = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    res.status(400).json({ success: false, code: "INVALID_REVIEW_ID" }); return;
  }
  if (!req.user || req.user.adminRole !== "super_admin") {
    res.status(403).json({ success: false, code: "INDEPENDENT_SUPERVISOR_REQUIRED" }); return;
  }
  const mongoose = (await import("mongoose")).default;
  const User = (await import("../models/User.model")).default;
  const StudentProfile = (await import("../models/StudentProfile.model")).default;
  const GuardianConsent = (await import("../models/GuardianConsent.model")).default;
  const session = await mongoose.startSession();
  let applied = false;
  try {
    await session.withTransaction(async () => {
      const review = await AgeReviewRequest.findOne({ _id: id, status: "in_review",
        reason: { $in: ["missing_date_of_birth", "incorrect_date_of_birth"] },
        evidenceCheckedBy: { $ne: req.user!._id },
        verifiedDateOfBirth: { $exists: true }, evidenceReference: { $exists: true },
      }).select("+verifiedDateOfBirth +evidenceReference").session(session);
      if (!review?.verifiedDateOfBirth || !review.evidenceReference) return;
      const dob = review.verifiedDateOfBirth;
      const now = new Date();
      const age = now.getUTCFullYear() - dob.getUTCFullYear() -
        (now.getUTCMonth() < dob.getUTCMonth() ||
          (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate()) ? 1 : 0);
      // Keep minors locked, even where existing guardian consent was previously granted.
      const changed = await User.updateOne({ _id: review.student, role: "student" },
        { $set: { dateOfBirth: dob, isMinor: age < 18,
          parentConsentVerified: false }, $unset: { guardianConsentVerifiedAt: "" } }, { session });
      if (changed.matchedCount !== 1) return;
      await StudentProfile.updateOne({ user: review.student },
        { $set: { dateOfBirth: dob.toISOString().slice(0, 10) } }, { session });
      await GuardianConsent.updateMany({ student: review.student },
        { $set: { status: "expired" }, $unset: { verifiedAt: "", verifiedBy: "" } }, { session });
      const closed = await AgeReviewRequest.updateOne({ _id: review._id, status: "in_review",
        evidenceCheckedBy: review.evidenceCheckedBy },
        { $set: { status: "closed", reviewedBy: req.user!._id, reviewedAt: now } }, { session });
      if (closed.modifiedCount !== 1) throw new Error("Concurrent review closure");
      applied = true;
    });
  } finally { await session.endSession(); }
  if (!applied) { res.status(409).json({ success: false, code: "VERIFICATION_NOT_READY" }); return; }
  await logAudit({ action: "student_dob_verified_and_consent_reset",
    actor: req.user.name || "Supervisor", actorId: req.user._id.toString(),
    entity: "AgeReviewRequest", targetId: id,
    metadata: { process: "independent_review", consentReset: true } });
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, status: "closed", guardianConsentReset: true });
};
