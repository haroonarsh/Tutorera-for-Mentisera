import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";

type Entry = NonNullable<ITutorProfile["subjectEligibility"]>[number];
type Evidence = NonNullable<Entry["evidence"]>[number];

export function hasApprovedSubjectEvidence(evidence: Evidence): boolean {
  return Boolean(evidence.url && evidence.publicId && evidence.status === "approved" &&
    evidence.reviewedBy && evidence.reviewedAt && evidence.reviewedPublicId === evidence.publicId);
}

export function reviewSubjectEvidence(entry: Entry, index: number, status: "approved" | "rejected", reason: string, actorId: string): { success: boolean; message?: string } {
  if (["approved", "revoked", "suspended"].includes(entry.status)) return { success: false, message: "Evidence cannot be reviewed for a closed subject request." };
  const evidence = Number.isInteger(index) && index >= 0 ? entry.evidence?.[index] : undefined;
  if (!evidence?.publicId || !evidence.url) return { success: false, message: "Securely uploaded supporting evidence is required." };
  if (evidence.status === "approved" || evidence.status === "rejected") return { success: false, message: "This evidence already has a decision. Submit a new document for another review." };
  if (!reason.trim()) return { success: false, message: "An evidence-specific review reason is required." };
  evidence.status = status;
  evidence.reason = reason.trim();
  evidence.reviewedBy = new Types.ObjectId(actorId);
  evidence.reviewedAt = new Date();
  evidence.reviewedPublicId = evidence.publicId;
  entry.status = (entry.evidence || []).some(hasApprovedSubjectEvidence) || (entry.evidence || []).some((item) => !item.status || item.status === "pending") ? "pending" : "needs_evidence";
  return { success: true };
}
