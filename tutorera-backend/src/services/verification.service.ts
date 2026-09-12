import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import TutorDocumentReview from "../models/TutorDocumentReview.model";
import AdminVerificationReview from "../models/AdminVerificationReview.model";
import User from "../models/User.model";
import { sendNotification } from "../utils/socket";
import { logAudit } from "../utils/logAudit";
import { recordStatusEvent } from "./tracking.service";
import { StatusEvent } from "../models/TutorApplicationStatusHistory.model";

const COMPONENTS = ["cnic", "degree", "demoVideo", "police"] as const;
type VerificationComponent = (typeof COMPONENTS)[number];

interface ReviewActor {
  id: string;
  name: string;
  role: "admin" | "system";
}

function isPoliceRequired(profile: { teachingMode: string; countryCode?: string }): boolean {
  const inPerson = profile.teachingMode === "in-person" || profile.teachingMode === "both";
  const homeCountries = ["PK", "SA", "AE", "IN", "GB"];
  const country = (profile.countryCode || "PK") as string;
  return inPerson && homeCountries.includes(country);
}

function getComponentField(component: VerificationComponent): string {
  switch (component) {
    case "cnic": return "cnicVerificationStatus";
    case "degree": return "degreeVerificationStatus";
    case "demoVideo": return "demoVideoStatus";
    case "police": return "policeVerificationStatus";
  }
}

function getComponentRejectionField(component: VerificationComponent): string {
  switch (component) {
    case "cnic": return "cnicRejectionReason";
    case "degree": return "degreeRejectionReason";
    case "demoVideo": return "demoVideoRejectionReason";
    case "police": return "policeRejectionReason";
  }
}

function getComponentSubmittedField(component: VerificationComponent): string {
  switch (component) {
    case "cnic": return "cnicSubmittedAt";
    case "degree": return "degreeSubmittedAt";
    case "demoVideo": return "demoVideoSubmittedAt";
    case "police": return "policeSubmittedAt";
  }
}

function getComponentReviewedField(component: VerificationComponent): string {
  switch (component) {
    case "cnic": return "cnicReviewedAt";
    case "degree": return "degreeReviewedAt";
    case "demoVideo": return "demoVideoReviewedAt";
    case "police": return "policeReviewedAt";
  }
}

export async function syncReviewQueueForProfile(tutorProfileId: string): Promise<void> {
  const profile = await TutorProfile.findById(tutorProfileId).lean();
  if (!profile) return;

  const tutorId = (profile as any).user;
  const now = new Date();

  for (const component of COMPONENTS) {
    const statusField = getComponentField(component);
    const currentStatus = (profile as any)[statusField];

    if (currentStatus !== "pending") continue;

    const existing = await TutorDocumentReview.findOne({
      tutor: tutorId,
      tutorProfile: tutorProfileId,
      component,
    }).lean();

    const slaHours = component === "police" ? 48 : 24;

    if (!existing) {
      await TutorDocumentReview.create({
        tutor: tutorId,
        tutorProfile: tutorProfileId,
        component,
        status: "pending",
        priority: 0,
        slaHours,
        slaDeadline: new Date(now.getTime() + slaHours * 60 * 60 * 1000),
        autoEscalated: false,
      });
    } else if (existing.status !== "pending" && existing.status !== "in_review") {
      await TutorDocumentReview.findByIdAndUpdate(existing._id, {
        status: "pending",
        rejectionReason: "",
        completedAt: null,
        priority: 1, // bump priority for resubmissions
        slaHours,
        slaDeadline: new Date(now.getTime() + slaHours * 60 * 60 * 1000),
        autoEscalated: false,
      });
    }
  }
}

export async function getReviewQueue(filters: {
  status?: string;
  component?: string;
  assignedTo?: string;
  page: number;
  limit: number;
  search?: string;
}): Promise<{ items: any[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, filters.page);
  const limit = Math.min(100, Math.max(1, filters.limit));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.component && filters.component !== "all") {
    query.component = filters.component;
  }
  if (filters.assignedTo && filters.assignedTo !== "unassigned") {
    query.assignedTo = new mongoose.Types.ObjectId(filters.assignedTo);
  } else if (filters.assignedTo === "unassigned") {
    query.assignedTo = { $exists: false };
  }

  const items = await TutorDocumentReview.find(query)
    .populate("tutor", "name email countryCode city applicationId")
    .populate("tutorProfile", "verificationStatus onboardingComplete")
    .populate("assignedTo", "name email")
    .sort({ priority: -1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await TutorDocumentReview.countDocuments(query);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getReviewQueueItem(id: string): Promise<any | null> {
  return TutorDocumentReview.findById(id)
    .populate("tutor", "name email phone countryCode city")
    .populate("tutorProfile")
    .populate("assignedTo", "name email")
    .lean();
}

export async function assignReviewItem(
  reviewId: string,
  adminId: string,
  actor: ReviewActor
): Promise<any> {
  const item = await TutorDocumentReview.findById(reviewId);
  if (!item) {
    throw new Error("Review item not found");
  }

  item.assignedTo = new mongoose.Types.ObjectId(adminId);
  item.assignedAt = new Date();
  item.status = "in_review";
  await item.save();

  await logAudit({
    action: "verification_review_assigned",
    actor: actor.name,
    actorId: actor.id,
    entity: "TutorDocumentReview",
    targetId: reviewId,
  });

  return item;
}

export async function approveComponent(
  reviewId: string,
  actor: ReviewActor,
  io?: any
): Promise<any> {
  const item = await TutorDocumentReview.findById(reviewId);
  if (!item) {
    throw new Error("Review item not found");
  }

  const profile = await TutorProfile.findById(item.tutorProfile);
  if (!profile) {
    throw new Error("Tutor profile not found");
  }

  const component = item.component as VerificationComponent;
  const statusField = getComponentField(component);
  const reviewedField = getComponentReviewedField(component);

  (profile as any)[statusField] = "approved";
  (profile as any)[reviewedField] = new Date();

  await profile.save({ validateBeforeSave: false });

  item.status = "approved";
  item.completedAt = new Date();
  await item.save();

  await AdminVerificationReview.create({
    tutor: item.tutor,
    tutorProfile: item.tutorProfile,
    admin: new mongoose.Types.ObjectId(actor.id),
    component,
    decision: "approved",
    previousStatus: "pending",
    newStatus: "approved",
  });

  const tutorUser = await User.findById(item.tutor).select("name email applicationId");
  if (tutorUser && io) {
    await sendNotification(io, tutorUser._id.toString(), {
      title: `${component.toUpperCase()} Verified`,
      message: `Your ${component} document has been approved.`,
      type: "verification",
      link: "/tutor/application-status",
    });
  }

  await recordStatusEvent({
    tutorId: item.tutor.toString(),
    tutorProfileId: item.tutorProfile.toString(),
    actor: { name: actor.name, role: "admin", id: actor.id },
    event: `${component.toUpperCase()}_VERIFIED` as StatusEvent,
    message: `${component.toUpperCase()} approved by admin`,
    statusAfter: "approved",
  });

  await logAudit({
    action: "verification_component_approved",
    actor: actor.name,
    actorId: actor.id,
    entity: "TutorProfile",
    targetId: item.tutorProfile.toString(),
    targetName: tutorUser?.name || "Tutor",
    metadata: { component },
  });

  await cleanupDuplicateQueueItems(item.tutor, item.tutorProfile, component);

  return profile;
}

export async function rejectComponent(
  reviewId: string,
  rejectionReason: string,
  actor: ReviewActor,
  io?: any
): Promise<any> {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error("Rejection reason is required");
  }

  const item = await TutorDocumentReview.findById(reviewId);
  if (!item) {
    throw new Error("Review item not found");
  }

  const profile = await TutorProfile.findById(item.tutorProfile);
  if (!profile) {
    throw new Error("Tutor profile not found");
  }

  const component = item.component as VerificationComponent;
  const statusField = getComponentField(component);
  const rejectionField = getComponentRejectionField(component);
  const reviewedField = getComponentReviewedField(component);

  (profile as any)[statusField] = "rejected";
  (profile as any)[rejectionField] = rejectionReason.trim();
  (profile as any)[reviewedField] = new Date();

  await profile.save({ validateBeforeSave: false });

  item.status = "rejected";
  item.rejectionReason = rejectionReason.trim();
  item.completedAt = new Date();
  await item.save();

  await AdminVerificationReview.create({
    tutor: item.tutor,
    tutorProfile: item.tutorProfile,
    admin: new mongoose.Types.ObjectId(actor.id),
    component,
    decision: "rejected",
    previousStatus: "pending",
    newStatus: "rejected",
    rejectionReason: rejectionReason.trim(),
  });

  const tutorUser = await User.findById(item.tutor).select("name email applicationId");
  if (tutorUser && io) {
    await sendNotification(io, tutorUser._id.toString(), {
      title: `${component.toUpperCase()} Rejected`,
      message: `Your ${component} document was rejected: ${rejectionReason}`,
      type: "verification",
      link: "/tutor/application-status",
    });
  }

  await recordStatusEvent({
    tutorId: item.tutor.toString(),
    tutorProfileId: item.tutorProfile.toString(),
    actor: { name: actor.name, role: "admin", id: actor.id },
    event: `${component.toUpperCase()}_REJECTED` as StatusEvent,
    message: `${component.toUpperCase()} rejected: ${rejectionReason}`,
    statusAfter: "rejected",
  });

  await logAudit({
    action: "verification_component_rejected",
    actor: actor.name,
    actorId: actor.id,
    entity: "TutorProfile",
    targetId: item.tutorProfile.toString(),
    targetName: tutorUser?.name || "Tutor",
    metadata: { component, reason: rejectionReason },
  });

  await cleanupDuplicateQueueItems(item.tutor, item.tutorProfile, component);

  return profile;
}

export async function escalateReviewItem(
  reviewId: string,
  actor: ReviewActor
): Promise<any> {
  const item = await TutorDocumentReview.findById(reviewId);
  if (!item) {
    throw new Error("Review item not found");
  }

  item.status = "escalated";
  item.autoEscalated = true;
  item.adminNotes = item.adminNotes
    ? `${item.adminNotes}\n[Escalated by ${actor.name}]`
    : `[Escalated by ${actor.name}]`;
  await item.save();

  await AdminVerificationReview.create({
    tutor: item.tutor,
    tutorProfile: item.tutorProfile,
    admin: new mongoose.Types.ObjectId(actor.id),
    component: item.component,
    decision: "escalated",
    previousStatus: item.status,
    newStatus: "escalated",
  });

  await logAudit({
    action: "verification_review_escalated",
    actor: actor.name,
    actorId: actor.id,
    entity: "TutorDocumentReview",
    targetId: reviewId,
    metadata: { component: item.component },
  });

  return item;
}

export async function getReviewHistory(tutorProfileId: string): Promise<any[]> {
  const reviews = await AdminVerificationReview.find({ tutorProfile: tutorProfileId })
    .populate("admin", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((r) => ({
    id: r._id.toString(),
    component: r.component,
    decision: r.decision,
    previousStatus: r.previousStatus,
    newStatus: r.newStatus,
    rejectionReason: r.rejectionReason,
    internalNotes: r.internalNotes,
    reviewedAt: r.createdAt,
    reviewedBy: (r.admin as any)?.name || "System",
  }));
}

async function cleanupDuplicateQueueItems(
  tutorId: mongoose.Types.ObjectId,
  tutorProfileId: mongoose.Types.ObjectId,
  component: string
): Promise<void> {
  const current = await TutorDocumentReview.findOne({
    tutor: tutorId,
    tutorProfile: tutorProfileId,
    component: component as any,
  }).sort({ createdAt: -1 });

  if (!current) return;

  await TutorDocumentReview.deleteMany({
    tutor: tutorId,
    tutorProfile: tutorProfileId,
    component: component as any,
    _id: { $ne: current._id },
  });
}