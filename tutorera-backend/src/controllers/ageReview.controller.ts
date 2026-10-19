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
  if (reason !== "missing_date_of_birth" && reason !== "incorrect_date_of_birth") {
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
  const closed = await AgeReviewRequest.findOneAndUpdate(
    { _id: id, status: { $in: ["pending", "in_review"] } },
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
