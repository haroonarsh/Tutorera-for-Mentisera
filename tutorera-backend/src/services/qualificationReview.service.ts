import { createHash } from "crypto";
import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";

export const DEGREE_LEVELS = ["secondary", "diploma", "bachelors", "masters", "doctorate"] as const;
export type DegreeLevel = typeof DEGREE_LEVELS[number];
type Qualification = ITutorProfile["education"][number];

export function normalizeDegreeLevel(value: unknown): DegreeLevel | undefined {
  if (typeof value !== "string") return undefined;
  const key = value.trim().toLowerCase().replace(/[’']/g, "");
  const aliases: Record<string, DegreeLevel> = { bachelor: "bachelors", master: "masters", phd: "doctorate", doctoral: "doctorate" };
  return DEGREE_LEVELS.includes(key as DegreeLevel) ? key as DegreeLevel : aliases[key];
}

/** Bind an administrative review to the precise credential, not an array position. */
export function qualificationFingerprint(qualification: Qualification): string {
  return createHash("sha256").update(JSON.stringify([
    qualification.degree, qualification.institution, qualification.year,
    qualification.discipline || "", qualification.disciplineRef?.toString() || "",
    qualification.degreeDoc, qualification.degreeDocPublicId || "",
  ])).digest("hex");
}

export function hasCurrentQualificationReview(qualification: Qualification): boolean {
  return Boolean(qualification.verificationStatus === "approved" && qualification.reviewedBy &&
    qualification.reviewedAt && qualification.reviewFingerprint === qualificationFingerprint(qualification));
}

/** The legacy wizard edits qualification zero, not the entire education list. */
export function replacePrimaryQualification(previous: Qualification[], primary: Qualification): Qualification[] {
  return preserveQualificationReviews(previous, [primary, ...previous.slice(1)]);
}

/** Preserve only server-owned decisions for credentials that are unchanged. */
export function preserveQualificationReviews(previous: Qualification[], incoming: Qualification[]): Qualification[] {
  return incoming.map((qualification) => {
    const existing = previous.find((candidate) => qualificationFingerprint(candidate) === qualificationFingerprint(qualification));
    return {
      ...qualification,
      verificationStatus: existing?.verificationStatus || "pending",
      verifiedDegreeLevel: existing?.verifiedDegreeLevel,
      reviewedBy: existing?.reviewedBy,
      reviewedAt: existing?.reviewedAt,
      reviewReason: existing?.reviewReason || "",
      reviewFingerprint: existing?.reviewFingerprint,
    };
  });
}

export function meetsMinimumDegreeLevel(qualification: Qualification, minimum?: string): boolean {
  if (!minimum?.trim()) return true;
  const required = normalizeDegreeLevel(minimum);
  const verified = normalizeDegreeLevel(qualification.verifiedDegreeLevel);
  return Boolean(hasCurrentQualificationReview(qualification) && required && verified &&
    DEGREE_LEVELS.indexOf(verified) >= DEGREE_LEVELS.indexOf(required));
}

export function reviewQualification(profile: ITutorProfile, index: number, status: "approved" | "rejected" | "pending", actorId: string, reason: string, degreeLevel?: unknown): { success: boolean; message?: string } {
  const qualification = profile.education[index];
  if (!Number.isInteger(index) || index < 0 || !qualification) return { success: false, message: "Choose an existing qualification to review." };
  const level = normalizeDegreeLevel(degreeLevel);
  if (degreeLevel !== undefined && !level) return { success: false, message: "Choose a valid verified degree level." };
  if (status === "approved" && (!qualification.degree?.trim() || !qualification.institution?.trim() || !qualification.degreeDoc?.trim())) {
    return { success: false, message: "The qualification needs a degree, institution, and uploaded document before approval." };
  }
  if (status === "rejected" && !reason.trim()) return { success: false, message: "A qualification-specific rejection reason is required." };
  qualification.verificationStatus = status;
  qualification.reviewedBy = new Types.ObjectId(actorId);
  qualification.reviewedAt = new Date();
  qualification.reviewReason = reason.trim();
  qualification.verifiedDegreeLevel = status === "approved" ? level : undefined;
  qualification.reviewFingerprint = status === "approved" ? qualificationFingerprint(qualification) : undefined;
  return { success: true };
}
