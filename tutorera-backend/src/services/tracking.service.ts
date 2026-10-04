import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.model";
import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import { isProfileMarketplaceEligible, policeIsRequired as activationPoliceIsRequired } from "./tutorActivation.service";
import TutorApplicationStatusHistory, {
  ITutorApplicationStatusHistory,
  StatusEvent,
} from "../models/TutorApplicationStatusHistory.model";
import ApplicationCounter from "../models/ApplicationCounter.model";
import {
  CanonicalStatus,
  getCanonicalStatusLabel,
} from "../contracts/tracking.contract";

export type { CanonicalStatus };
export { getCanonicalStatusLabel };

export type ComponentStatus =
  | "not_required"
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export interface ChecklistItem {
  key:
    | "personal"
    | "education"
    | "experience"
    | "profile"
    | "cnic"
    | "police"
    | "demoVideo"
    | "subjectEligibility";
  label: string;
  status: "done" | "pending" | "rejected" | "not_required";
  required: boolean;
  note?: string;
}

export interface TimelineCheckpoint {
  key: string;
  label: string;
  status: "done" | "pending" | "rejected" | "skipped";
  at?: string;
}

export interface EligibilityInfo {
  eligible: boolean;
  since: string | null;
  reasonIfBlocked: string | null;
}

export interface ActionRequired {
  title: string;
  body: string;
  cta: { label: string; href: string };
}

export interface StatusHistoryEntry {
  id: string;
  at: string;
  event: StatusEvent;
  message: string;
}

export interface TrackingPayloadBase {
  applicationId: string;
  tutorName: string;
  submittedAt: string | null;
  lastUpdatedAt: string;
  canonicalStatus: CanonicalStatus;
  canonicalStatusLabel: string;
  marketplaceEligibility: EligibilityInfo;
  homeTuitionEligibility: EligibilityInfo;
  homeTuitionRequired: boolean;
  verifiedBadge: boolean;
  demoVideo: {
    status: ComponentStatus;
    publicProfileVisible: boolean;
    reviewedAt: string | null;
    rejectionReason: string | null;
  };
  verificationChecklist: ChecklistItem[];
  progress: { completed: number; total: number; percent: number };
  timeline: TimelineCheckpoint[];
  history: StatusHistoryEntry[];
}

export interface VerificationComponent {
  status: ComponentStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface VerificationComponents {
  cnic: VerificationComponent;
  degree: VerificationComponent;
  demoVideo: VerificationComponent;
  police: VerificationComponent;
}

export interface AuthenticatedTrackingPayload extends TrackingPayloadBase {
  reVerificationRequired: boolean;
  suspended: boolean;
  suspendedReason: string | null;
  trackingTokenMeta: {
    createdAt: string | null;
    rotatedAt: string | null;
  };
  actionRequired: ActionRequired | null;
  publicTrackingPath: string;
  trackingToken?: string;
  verificationComponents: VerificationComponents;
}

export type PublicTrackingPayload = TrackingPayloadBase;

export async function allocateApplicationId(): Promise<string> {
  const year = new Date().getFullYear();
  const updated = await ApplicationCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const seq = (updated?.seq ?? 0).toString().padStart(6, "0");
  return `TUT-${year}-${seq}`;
}

export function generateTrackingToken(): { plaintext: string; hash: string } {
  const plaintext = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash };
}

export function hashTrackingToken(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

export async function findUserByTrackingToken(plaintextToken: string) {
  const hash = hashTrackingToken(plaintextToken);
  return User.findOne({ trackingTokenHash: hash });
}

function hasPersonalInfo(profile: { fullName?: string; phone?: string; city?: string; gender?: string; dateOfBirth?: string }): boolean {
  return Boolean(
    profile.fullName && profile.fullName.trim() !== "" &&
    profile.phone && profile.phone.trim() !== "" &&
    profile.city && profile.city.trim() !== "" &&
    profile.gender && profile.gender.trim() !== ""
  );
}

function hasEducation(profile: ITutorProfile): boolean {
  if (!Array.isArray(profile.education) || profile.education.length === 0) return false;
  const e = profile.education[0];
  return Boolean(e.degree && e.degree.trim() !== "" && e.institution && e.institution.trim() !== "" && e.year);
}

function hasExperience(profile: ITutorProfile): boolean {
  return Boolean(
    profile.experience > 0 &&
    Array.isArray(profile.subjects) && profile.subjects.length > 0 &&
    Array.isArray(profile.levels) && profile.levels.length > 0
  );
}

function hasProfile(profile: ITutorProfile): boolean {
  return Boolean(
    profile.bio && profile.bio.trim() !== "" &&
    profile.hourlyRate > 0 &&
    profile.teachingMode &&
    Array.isArray(profile.availability) && profile.availability.length > 0
  );
}

function hasCnic(profile: ITutorProfile): boolean {
  return Boolean(profile.cnicFront && profile.cnicBack);
}

function hasDemoVideo(profile: ITutorProfile): boolean {
  // The onboarding flow also permits a validated hosted demo URL, which has no
  // Cloudinary public ID. Visibility is still controlled by admin approval.
  return Boolean(profile.videoIntro);
}

export function policeIsRequired(profile: ITutorProfile): boolean {
  // Keep tracking and activation on the same market-specific home-tuition
  // safety policy. A generic in-person check caused status screens to disagree
  // with the activation decision in markets where this document is not required.
  return activationPoliceIsRequired(profile);
}

function hasPolice(profile: ITutorProfile): boolean {
  return Boolean(profile.policeCertificate);
}

export function isMarketplaceEligible(profile: ITutorProfile): boolean {
  return isProfileMarketplaceEligible(profile);
}

















export function isHomeTuitionEligible(profile: ITutorProfile): boolean {
  if (!policeIsRequired(profile)) return false;
  return isMarketplaceEligible(profile) && profile.policeVerificationStatus === "approved";
}

export function computeProgress(profile: ITutorProfile): { completed: number; total: number; percent: number } {
  // Verification and marketplace activation are separate stages. A tutor whose
  // application and required documents are approved must see verification as
  // complete even though their unsigned agreement deliberately keeps
  // marketplace access disabled. Do not let optional/profile-completeness
  // fields turn this state into the misleading 55% shown previously.
  const hasApprovedTeachingSubject = Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.some((entry) =>
    entry.status === "approved" && Array.isArray(entry.levels) && entry.levels.length > 0
  );
  const requiredDocumentsApproved =
    profile.cnicVerificationStatus === "approved" &&
    profile.degreeVerificationStatus === "approved" &&
    hasApprovedTeachingSubject &&
    profile.demoVideoStatus === "approved" &&
    (!policeIsRequired(profile) || profile.policeVerificationStatus === "approved");
  if (isMarketplaceEligible(profile) || (
    profile.verificationStatus === "approved" &&
    profile.isVerified &&
    requiredDocumentsApproved
  )) {
    return { completed: 100, total: 100, percent: 100 };
  }
  const steps: { done: boolean; weight: number }[] = [
    { done: hasPersonalInfo(profile), weight: 10 },
    { done: hasEducation(profile), weight: 20 },
    { done: hasExperience(profile), weight: 10 },
    { done: hasProfile(profile), weight: 10 },
    { done: hasCnic(profile), weight: 20 },
  ];
  if (policeIsRequired(profile)) {
    steps.push({ done: hasPolice(profile), weight: 15 });
  }
  steps.push({ done: hasDemoVideo(profile), weight: 15 });

  const total = steps.reduce((sum, s) => sum + s.weight, 0);
  const completed = steps.filter(s => s.done).reduce((sum, s) => sum + s.weight, 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function buildChecklist(profile: ITutorProfile): ChecklistItem[] {
  const items: ChecklistItem[] = [
    {
      key: "personal",
      label: "Profile information",
      status: hasPersonalInfo(profile) ? "done" : "pending",
      required: true,
    },
    {
      key: "education",
      label: "Educational documents",
      status: profile.degreeVerificationStatus === "approved"
        ? "done"
        : profile.degreeVerificationStatus === "rejected"
          ? "rejected"
          : hasEducation(profile)
            ? "pending"
            : "pending",
      required: true,
      note: profile.degreeRejectionReason || undefined,
    },
    {
      key: "cnic",
      label: "Identity document verification",
      status:
        profile.cnicVerificationStatus === "approved" ? "done" :
        profile.cnicVerificationStatus === "rejected" ? "rejected" :
        hasCnic(profile) ? "pending" : "pending",
      required: true,
      note: profile.cnicRejectionReason || undefined,
    },
    {
      key: "demoVideo",
      label: "Demo video",
      status:
        profile.demoVideoStatus === "approved" ? "done" :
        profile.demoVideoStatus === "rejected" ? "rejected" :
        hasDemoVideo(profile) ? "pending" : "pending",
      required: true,
      note: profile.demoVideoRejectionReason || undefined,
    },
  ];

  if (policeIsRequired(profile)) {
    items.push({
      key: "police",
      label: "Background & safety verification (required for home tuition)",
      status:
        profile.policeVerificationStatus === "approved" ? "done" :
        profile.policeVerificationStatus === "rejected" ? "rejected" :
        profile.policeVerificationStatus === "pending" ? "pending" :
        hasPolice(profile) ? "pending" : "pending",
      required: true,
      note: profile.policeRejectionReason || undefined,
    });
  } else {
    items.push({
      key: "police",
      label: "Background & safety verification (not required for online tuition)",
      status: "not_required",
      required: false,
      note: "Online tuition requires standard ID and degree verification. No police character check is required.",
    });
  }

  const subjectEntries = profile.subjectEligibility || [];
  const approvedSubject = subjectEntries.some((entry) => entry.status === "approved" && Array.isArray(entry.levels) && entry.levels.length > 0);
  const evidenceNeeded = subjectEntries.some((entry) => entry.status === "needs_evidence" || (entry.evidenceRequired && !(entry.evidence || []).length && entry.status !== "approved"));
  const rejectedSubject = subjectEntries.some((entry) => entry.status === "rejected");
  items.push({
    key: "subjectEligibility",
    label: "Teaching subject approval",
    status: approvedSubject ? "done" : rejectedSubject ? "rejected" : "pending",
    required: true,
    note: approvedSubject ? "At least one subject and teaching level has been approved." : evidenceNeeded ? "Supporting evidence is required before your conditional subject request can be reviewed." : "Your selected teaching subjects are awaiting an administrator’s approval.",
  });

  return items;
}

export function computeCanonicalStatus(profile: ITutorProfile): CanonicalStatus {
  if (profile.suspendedAt) return "SUSPENDED";
  if (profile.reVerificationRequired) return "RE_VERIFICATION_REQUIRED";
  if (profile.verificationStatus === "rejected") return "REJECTED";

  const agreementSigned = Boolean(profile.agreementAcceptedAt) || profile.legacyAgreementStatus === "accepted";

  if (profile.tutorStatus === "agreement_reacceptance_required") {
    return "AGREEMENT_REACCEPTANCE_REQUIRED";
  }

  if (isHomeTuitionEligible(profile)) return "HOME_TUITION_ELIGIBLE";

  if (isMarketplaceEligible(profile)) {
    if (policeIsRequired(profile) && profile.policeVerificationStatus !== "approved") {
      return "HOME_TUITION_VERIFICATION_REQUIRED";
    }
    return "APPROVED_FOR_MARKETPLACE";
  }

  const hasApprovedTeachingSubject = Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.some((entry) =>
    entry.status === "approved" && Array.isArray(entry.levels) && entry.levels.length > 0
  );
  if (!hasApprovedTeachingSubject && profile.verificationStatus === "approved") {
    return "SUBJECT_ELIGIBILITY_REQUIRED";
  }

  // New applications require explicit electronic agreement acceptance before
  // activation. This check intentionally follows the persisted-activation
  // check above so legacy, already-live marketplace profiles stay live.
  if ((profile.verificationStatus === "approved" || profile.tutorStatus === "approved_pending_agreement") && !agreementSigned) {
    return "APPROVED_PENDING_AGREEMENT";
  }

  const anyRejected =
    profile.cnicVerificationStatus === "rejected" ||
    profile.degreeVerificationStatus === "rejected" ||
    profile.demoVideoStatus === "rejected" ||
    profile.policeVerificationStatus === "rejected";
  if (anyRejected) return "ACTION_REQUIRED";

  if (!profile.onboardingComplete) {
    if (profile.onboardingStep <= 1 && !hasPersonalInfo(profile)) return "APPLICATION_STARTED";
    return "DOCUMENTS_REQUIRED";
  }

  const anyPending =
    profile.cnicVerificationStatus === "pending" ||
    profile.degreeVerificationStatus === "pending" ||
    profile.demoVideoStatus === "pending" ||
    profile.policeVerificationStatus === "pending";
  if (anyPending) return "VERIFICATION_IN_PROGRESS";

  return "UNDER_REVIEW";
}

function buildTimeline(profile: ITutorProfile, history: ITutorApplicationStatusHistory[]): TimelineCheckpoint[] {
  const at = (e: StatusEvent) => history.find(h => h.event === e)?.createdAt?.toISOString();
  const checkpoints: TimelineCheckpoint[] = [
    {
      key: "application",
      label: "Application submitted",
      status: profile.onboardingComplete ? "done" : "pending",
      at: at("APPLICATION_SUBMITTED") || profile.createdAt?.toISOString() || undefined,
    },
    {
      key: "profile",
      label: "Profile information",
      status: hasPersonalInfo(profile) ? "done" : "pending",
      at: at("PROFILE_INFORMATION_UPDATED"),
    },
    {
      key: "education",
      label: "Educational documents",
      status: profile.degreeVerificationStatus === "approved" ? "done" :
        profile.degreeVerificationStatus === "rejected" ? "rejected" : "pending",
      at: at("EDUCATIONAL_DOCUMENTS_VERIFIED") || at("EDUCATIONAL_DOCUMENTS_SUBMITTED"),
    },
    {
      key: "subjects",
      label: "Teaching subjects and levels",
      status: Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.some((entry) => entry.status === "approved" && Array.isArray(entry.levels) && entry.levels.length > 0)
        ? "done"
        : Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.some((entry) => entry.status === "rejected")
          ? "rejected"
          : "pending",
      at: undefined,
    },
    {
      key: "cnic",
      label: "Identity document verification",
      status: profile.cnicVerificationStatus === "approved" ? "done" :
        profile.cnicVerificationStatus === "rejected" ? "rejected" : "pending",
      at: at("CNIC_VERIFIED") || at("CNIC_SUBMITTED"),
    },
    {
      key: "demoVideo",
      label: "Demo video",
      status: profile.demoVideoStatus === "approved" ? "done" :
        profile.demoVideoStatus === "rejected" ? "rejected" : "pending",
      at: at("DEMO_VIDEO_APPROVED") || at("DEMO_VIDEO_SUBMITTED"),
    },
    {
      key: "marketplace",
      label: "Marketplace activation",
      status: isMarketplaceEligible(profile) ? "done" : "pending",
      at: at("MARKETPLACE_ACTIVATED") || profile.marketplaceEligibleAt?.toISOString(),
    },
  ];
  if (policeIsRequired(profile)) {
    checkpoints.push({
      key: "police",
      label: "Home tuition verification",
      status: profile.policeVerificationStatus === "approved" ? "done" :
        profile.policeVerificationStatus === "rejected" ? "rejected" : "pending",
      at: at("POLICE_VERIFICATION_APPROVED") || at("POLICE_VERIFICATION_SUBMITTED"),
    });
  } else {
    checkpoints.push({
      key: "police",
      label: "Home tuition verification",
      status: "skipped",
    });
  }
  return checkpoints;
}

function buildActionRequired(profile: ITutorProfile): ActionRequired | null {
  const RESUBMIT_URL = "/tutor/resubmit-docs";
  const agreementSigned = Boolean(profile.agreementAcceptedAt) || profile.legacyAgreementStatus === "accepted";
  const hasEducationCredential = Array.isArray(profile.education) && profile.education.some((entry) =>
    Boolean(entry.degree?.trim() && entry.institution?.trim() && entry.year && entry.degreeDoc)
  );
  const hasSubjectRequest = Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.length > 0;
  const hasApprovedTeachingSubject = Array.isArray(profile.subjectEligibility) && profile.subjectEligibility.some((entry) =>
    entry.status === "approved" && Array.isArray(entry.levels) && entry.levels.length > 0
  );
  if (!hasEducationCredential) {
    return {
      title: "Submit your education credentials",
      body: "Add your qualification, institution, graduation year, and a clear degree certificate or transcript. Marketplace activation cannot continue until this evidence is submitted and verified.",
      cta: { label: "Add education credentials", href: "/onboarding/tutor?step=2" },
    };
  }
  if (!hasSubjectRequest) {
    return {
      title: "Choose teaching subjects and levels",
      body: "Select every subject and teaching level you want to offer. An administrator must approve at least one subject-level request before marketplace activation.",
      cta: { label: "Choose subjects and levels", href: "/onboarding/tutor?step=3" },
    };
  }
  if (!hasApprovedTeachingSubject) {
    return {
      title: "Subject eligibility is awaiting approval",
      body: "Your requested subjects and levels must be reviewed by an administrator. Subjects outside your declared discipline may need supporting educational evidence.",
      cta: { label: "Review education and subjects", href: "/onboarding/tutor?step=3" },
    };
  }
  if (profile.verificationStatus === "approved" && !agreementSigned && !isMarketplaceEligible(profile)) {
    return {
      title: "Accept Your Tutor Marketplace Agreement",
      body: "Congratulations! Your application has been approved. Review and electronically accept the Tutor Marketplace Agreement (TTA-2026.1) to activate your account and marketplace access.",
      cta: { label: "Review & Accept Agreement", href: "/tutor/accept-agreement" },
    };
  }
  if (profile.tutorStatus === "agreement_reacceptance_required") {
    return {
      title: "Action Required: Updated Tutor Agreement",
      body: "TUTORERA has published an updated Tutor Marketplace Agreement. Please review and accept the updated terms to maintain active bidding privileges.",
      cta: { label: "Review Updated Agreement", href: "/tutor/accept-agreement" },
    };
  }
  const reasons: { key: string; title: string; body: string; cta: { label: string; href: string } }[] = [];
  if (profile.cnicVerificationStatus === "rejected") {
    reasons.push({
      key: "cnic",
      title: "Identity document image needs to be re-uploaded",
      body: profile.cnicRejectionReason || "Your identity document image could not be verified. Please upload a clearer image.",
      cta: { label: "Re-upload identity document", href: RESUBMIT_URL },
    });
  }
  if (profile.degreeVerificationStatus === "rejected") {
    reasons.push({
      key: "degree",
      title: "Educational document needs to be re-uploaded",
      body: profile.degreeRejectionReason || "Your educational document was not accepted. Please upload a clearer copy.",
      cta: { label: "Re-upload degree document", href: RESUBMIT_URL },
    });
  }
  if (profile.demoVideoStatus === "rejected") {
    reasons.push({
      key: "demoVideo",
      title: "Demo video needs to be re-recorded",
      body: profile.demoVideoRejectionReason || "Please record your demo video again in a well-lit environment and clearly introduce the subjects you teach.",
      cta: { label: "Re-upload demo video", href: RESUBMIT_URL },
    });
  }
  if (profile.policeVerificationStatus === "rejected") {
    reasons.push({
      key: "police",
      title: "Background and safety verification needs to be re-submitted",
      body: profile.policeRejectionReason || "Your background and safety certificate could not be accepted. Please submit a current certificate.",
      cta: { label: "Re-submit background & safety certificate", href: RESUBMIT_URL },
    });
  }
  if (policeIsRequired(profile) && profile.policeVerificationStatus !== "approved" && profile.policeVerificationStatus !== "pending" && profile.policeVerificationStatus !== "rejected") {
    // Covers both the normal "not_submitted" case and the (should no longer
    // happen going forward, but defensively handled) "not_required" case a
    // profile could be stuck in if teachingMode changed to in-person/both
    // before the write-paths that reset this were fixed.
    reasons.push({
      key: "policeMissing",
      title: "Background and safety verification required",
      body: "Background and safety verification is mandatory before you can provide home or in-person tuition through TUTORERA.",
      cta: { label: "Submit background & safety certificate", href: RESUBMIT_URL },
    });
  }
  if (reasons.length === 0) return null;
  const first = reasons[0];
  return { title: first.title, body: first.body, cta: first.cta };
}

async function loadHistory(tutorUserId: mongoose.Types.ObjectId, publicOnly: boolean): Promise<StatusHistoryEntry[]> {
  const filter: Record<string, unknown> = { tutor: tutorUserId };
  if (publicOnly) filter.isPublic = true;
  const rows = await TutorApplicationStatusHistory.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  return rows.map(r => ({
    id: r._id.toString(),
    at: (r.createdAt as Date).toISOString(),
    event: r.event as StatusEvent,
    message: r.message,
  }));
}

export async function buildAuthenticatedTrackingPayload(
  userId: string,
  opts: { includePlainToken?: string } = {}
): Promise<AuthenticatedTrackingPayload | null> {
  const user = await User.findById(userId);
  if (!user || user.role !== "tutor") return null;
  const profile = await TutorProfile.findOne({ user: user._id });
  if (!profile) return null;
  if (!user.applicationId) {
    user.applicationId = await allocateApplicationId();
    await user.save();
  }
  if (!user.trackingTokenHash) {
    const t = generateTrackingToken();
    user.trackingTokenHash = t.hash;
    user.trackingTokenCreatedAt = new Date();
    await user.save();
    opts.includePlainToken = t.plaintext;
  }

  // Self-heal only incomplete, newly-approved applications. A prior version
  // also ran this against profiles that were already marketplaceEligible,
  // overwriting their active state simply because historic agreement metadata
  // was not available. Persisted activation is authoritative for those legacy
  // profiles and must never be revoked by a read/status endpoint.
  const coreDocsApproved =
    profile.cnicVerificationStatus === "approved" &&
    profile.degreeVerificationStatus === "approved" &&
    profile.demoVideoStatus === "approved" &&
    !profile.suspendedAt &&
    !profile.reVerificationRequired;

  const agreementSigned = Boolean(profile.agreementAcceptedAt) || profile.legacyAgreementStatus === "accepted";

  const hasPersistedMarketplaceActivation = Boolean(
    profile.marketplaceEligible &&
    !profile.suspendedAt &&
    !profile.reVerificationRequired &&
    profile.tutorStatus !== "suspended" &&
    profile.tutorStatus !== "reverification_required" &&
    profile.tutorStatus !== "terminated"
  );

  if (!hasPersistedMarketplaceActivation && (coreDocsApproved || profile.verificationStatus === "approved") && !agreementSigned) {
    if (profile.verificationStatus !== "approved" || profile.tutorStatus !== "approved_pending_agreement") {
      profile.verificationStatus = "approved";
      profile.isVerified = true;
      profile.tutorStatus = "approved_pending_agreement";
      profile.agreementAcceptanceRequired = true;
      profile.marketplaceEligible = false;
      await profile.save({ validateBeforeSave: false });
    }
  }

  const canonicalStatus = computeCanonicalStatus(profile);
  const marketplaceEligible = isMarketplaceEligible(profile);
  const homeTuitionEligible = isHomeTuitionEligible(profile);
  const history = await loadHistory(user._id, false);
  const publicHistory = history;

  const marketplaceBlockReason = (() => {
    if (profile.suspendedAt) return "Your profile is currently suspended.";
    if (profile.reVerificationRequired) return "Re-verification is required before marketplace access resumes.";
    if (profile.agreementAcceptanceRequired && !profile.agreementAcceptedAt) return "Accept the Tutor Marketplace Agreement to activate marketplace access.";
    if (!profile.onboardingComplete) return "Complete onboarding to unlock the marketplace.";
    if (profile.cnicVerificationStatus !== "approved") return "Identity document verification is required.";
    if (profile.demoVideoStatus !== "approved") return "Demo video approval is required.";
    if (profile.degreeVerificationStatus === "rejected") return "Educational document was rejected.";
    if (profile.verificationStatus !== "approved") return "Profile approval is pending.";
    return null;
  })();

  const homeTuitionBlockReason = (() => {
    if (!policeIsRequired(profile)) return "Home tuition is not required for your teaching mode.";
    if (homeTuitionEligible) return null;
    if (profile.policeVerificationStatus === "approved") return null;
    if (!profile.policeCertificate) return "Submit your background and safety certificate.";
    if (profile.policeVerificationStatus === "pending") return "Background and safety verification is under review.";
    if (profile.policeVerificationStatus === "rejected") return "Background and safety verification was rejected.";
    return "Marketplace requirements must be completed first.";
  })();

  return {
    applicationId: user.applicationId,
    tutorName: user.name,
    submittedAt: (user.applicationSubmittedAt || profile.createdAt)?.toISOString() || null,
    lastUpdatedAt: (profile.lastStatusChangeAt || profile.updatedAt || new Date()).toISOString(),
    canonicalStatus,
    canonicalStatusLabel: getCanonicalStatusLabel(canonicalStatus),
    marketplaceEligibility: {
      eligible: marketplaceEligible,
      since: profile.marketplaceEligibleAt?.toISOString() || null,
      reasonIfBlocked: marketplaceBlockReason,
    },
    homeTuitionEligibility: {
      eligible: homeTuitionEligible,
      since: profile.homeTuitionEligibleAt?.toISOString() || null,
      reasonIfBlocked: homeTuitionBlockReason,
    },
    homeTuitionRequired: policeIsRequired(profile),
    verifiedBadge: profile.isVerified && profile.cnicVerificationStatus === "approved",
    demoVideo: {
      status: (profile.demoVideoStatus as ComponentStatus) || "not_submitted",
      publicProfileVisible: profile.demoVideoStatus === "approved",
      reviewedAt: profile.demoVideoReviewedAt?.toISOString() || null,
      rejectionReason: profile.demoVideoRejectionReason || null,
    },
    verificationChecklist: buildChecklist(profile),
    progress: computeProgress(profile),
    timeline: buildTimeline(profile, history as unknown as ITutorApplicationStatusHistory[]),
    history: publicHistory,
    reVerificationRequired: profile.reVerificationRequired,
    suspended: Boolean(profile.suspendedAt),
    suspendedReason: profile.suspendedReason || null,
    trackingTokenMeta: {
      createdAt: user.trackingTokenCreatedAt?.toISOString() || null,
      rotatedAt: user.trackingTokenRotatedAt?.toISOString() || null,
    },
    actionRequired: buildActionRequired(profile),
    publicTrackingPath: "/track/tutor/[secure-token]",
    trackingToken: opts.includePlainToken,
    verificationComponents: {
      cnic: {
        status: (profile.cnicVerificationStatus as ComponentStatus) || "not_submitted",
        rejectionReason: profile.cnicRejectionReason || null,
        submittedAt: profile.cnicSubmittedAt?.toISOString() || null,
        reviewedAt: profile.cnicReviewedAt?.toISOString() || null,
      },
      degree: {
        status: (profile.degreeVerificationStatus as ComponentStatus) || "not_submitted",
        rejectionReason: profile.degreeRejectionReason || null,
        submittedAt: profile.degreeSubmittedAt?.toISOString() || null,
        reviewedAt: profile.degreeReviewedAt?.toISOString() || null,
      },
      demoVideo: {
        status: (profile.demoVideoStatus as ComponentStatus) || "not_submitted",
        rejectionReason: profile.demoVideoRejectionReason || null,
        submittedAt: profile.demoVideoSubmittedAt?.toISOString() || null,
        reviewedAt: profile.demoVideoReviewedAt?.toISOString() || null,
      },
      police: {
        status: (profile.policeVerificationStatus as ComponentStatus) || "not_required",
        rejectionReason: profile.policeRejectionReason || null,
        submittedAt: profile.policeSubmittedAt?.toISOString() || null,
        reviewedAt: profile.policeReviewedAt?.toISOString() || null,
      },
    },
  };
}

export async function buildPublicTrackingPayload(plaintextToken: string): Promise<PublicTrackingPayload | null> {
  const user = await findUserByTrackingToken(plaintextToken);
  if (!user || user.role !== "tutor") return null;
  const profile = await TutorProfile.findOne({ user: user._id });
  if (!profile) return null;

  const canonicalStatus = computeCanonicalStatus(profile);
  const marketplaceEligible = isMarketplaceEligible(profile);
  const homeTuitionEligible = isHomeTuitionEligible(profile);
  const history = await loadHistory(user._id, true);

  const firstName = (user.name || "").split(" ")[0] || "Tutor";
  const displayName = firstName + (user.name && user.name.split(" ").length > 1 ? ` ${user.name.split(" ").slice(-1)[0].charAt(0)}.` : "");

  return {
    applicationId: user.applicationId || "TUT-UNKNOWN",
    tutorName: displayName,
    submittedAt: (user.applicationSubmittedAt || profile.createdAt)?.toISOString() || null,
    lastUpdatedAt: (profile.lastStatusChangeAt || profile.updatedAt || new Date()).toISOString(),
    canonicalStatus,
    canonicalStatusLabel: getCanonicalStatusLabel(canonicalStatus),
    marketplaceEligibility: {
      eligible: marketplaceEligible,
      since: null,
      reasonIfBlocked: null,
    },
    homeTuitionEligibility: {
      eligible: homeTuitionEligible,
      since: null,
      reasonIfBlocked: null,
    },
    homeTuitionRequired: policeIsRequired(profile),
    verifiedBadge: false,
    demoVideo: {
      status: profile.demoVideoStatus === "approved" ? "approved" : "not_submitted",
      publicProfileVisible: profile.demoVideoStatus === "approved",
      reviewedAt: null,
      rejectionReason: null,
    },
    verificationChecklist: buildChecklist(profile).map(item => ({ ...item, note: undefined })),
    progress: computeProgress(profile),
    timeline: buildTimeline(profile, history as unknown as ITutorApplicationStatusHistory[]),
    history,
  };
}

export interface RecordStatusEventInput {
  tutorId: string;
  tutorProfileId?: string;
  actor: { name: string; role: "system" | "tutor" | "admin"; id?: string };
  event: StatusEvent;
  message: string;
  isPublic?: boolean;
  statusBefore?: string;
  statusAfter?: string;
}

export async function recordStatusEvent(input: RecordStatusEventInput): Promise<void> {
  try {
    await TutorApplicationStatusHistory.create({
      tutor: new mongoose.Types.ObjectId(input.tutorId),
      tutorProfile: input.tutorProfileId ? new mongoose.Types.ObjectId(input.tutorProfileId) : undefined,
      actor: input.actor.name,
      actorId: input.actor.id && mongoose.Types.ObjectId.isValid(input.actor.id) ? new mongoose.Types.ObjectId(input.actor.id) : undefined,
      actorRole: input.actor.role,
      event: input.event,
      message: input.message,
      isPublic: input.isPublic !== false,
      statusBefore: input.statusBefore,
      statusAfter: input.statusAfter,
    });
  } catch (err) {
    console.error("[TrackingService] Failed to record status event:", err);
  }
}



