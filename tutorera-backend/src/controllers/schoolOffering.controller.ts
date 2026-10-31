import { Response } from "express";
import SchoolOffering from "../models/SchoolOffering.model";
import TutorProfile from "../models/TutorProfile.model";
import { AuthRequest } from "../types";
import { logAudit } from "../utils/logAudit";

export async function getMySchoolOfferings(req: AuthRequest, res: Response) {
  const profile = await TutorProfile.findOne({ user: req.user?._id }).select("schoolOfferingIds subjects").lean();
  if (!profile) { res.status(404).json({ success: false, message: "Complete your tutor profile first." }); return; }
  res.json({ success: true, schoolOfferingIds: profile.schoolOfferingIds || [], subjects: profile.subjects || [] });
}

export async function updateMySchoolOfferings(req: AuthRequest, res: Response) {
  if (!Array.isArray(req.body?.schoolOfferingIds) || req.body.schoolOfferingIds.length > 300 || req.body.schoolOfferingIds.some((id: unknown) => typeof id !== "string" || id.length > 200)) {
    res.status(422).json({ success: false, message: "Select valid school offerings." }); return;
  }
  const ids: string[] = [...new Set(req.body.schoolOfferingIds as string[])];
  const profile = await TutorProfile.findOne({ user: req.user?._id }).select("subjects").lean();
  if (!profile) { res.status(404).json({ success: false, message: "Complete your tutor profile first." }); return; }
  const offerings = await SchoolOffering.find({ _id: { $in: ids }, status: "active" }).select("subject").lean();
  if (offerings.length !== ids.length) { res.status(422).json({ success: false, message: "One or more offerings are no longer active." }); return; }
  const selected = new Set((profile.subjects || []).map((subject) => subject.trim().toLowerCase()));
  if (offerings.some((offering) => !selected.has(offering.subject.trim().toLowerCase()))) { res.status(422).json({ success: false, message: "Add each subject to your tutor profile before selecting its board and qualification." }); return; }
  await TutorProfile.updateOne({ user: req.user?._id }, { $set: { schoolOfferingIds: ids } });
  await logAudit({ action: "tutor_school_offerings_updated", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "TutorProfile", targetId: String(profile._id), metadata: { count: ids.length } });
  res.json({ success: true, schoolOfferingIds: ids, message: "Teaching preferences saved. Subject and level approval is still required." });
}

export async function listAdminSchoolOfferings(_req: AuthRequest, res: Response) {
  const offerings = await SchoolOffering.find().sort({ boardName: 1, qualificationName: 1, classLevel: 1, subjectDisplay: 1 }).lean();
  res.json({ success: true, count: offerings.length, offerings });
}

export async function updateAdminSchoolOffering(req: AuthRequest, res: Response) {
  const { status, reason } = req.body || {};
  if (!["active", "inactive"].includes(status) || typeof reason !== "string" || reason.trim().length < 5 || reason.length > 500) { res.status(422).json({ success: false, message: "Provide a status and a reason of at least five characters." }); return; }
  const offering = await SchoolOffering.findById(req.params.id);
  if (!offering) { res.status(404).json({ success: false, message: "Offering not found." }); return; }
  // The Workers bundler tsconfig infers some Mongoose Document fields as Buffer; runtime values
  // are a string boardCode, ObjectId reviewedBy, and Date reviewedAt. Type the working copy
  // explicitly so both tsconfigs agree without changing stored values.
  const doc = offering as unknown as {
    boardCode: string;
    status: "active" | "inactive";
    reviewReason: string;
    reviewedBy: unknown;
    reviewedAt: Date;
    verificationSource?: string;
    save(): Promise<unknown>;
  };
  if (status === "active" && doc.boardCode === "pearson" && !doc.verificationSource) { res.status(409).json({ success: false, message: "A verified Pearson source is required before activation." }); return; }
  doc.status = status; doc.reviewReason = reason.trim(); doc.reviewedBy = req.user?._id; doc.reviewedAt = new Date();
  await doc.save();
  await logAudit({ action: "school_offering_reviewed", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "SchoolOffering", targetId: String(offering._id), metadata: { status, reason: reason.trim() } });
  res.json({ success: true, offering });
}
