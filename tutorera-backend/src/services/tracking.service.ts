import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.model";
import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import TutorApplicationStatusHistory, {
  ITutorApplicationStatusHistory,
  StatusEvent,
} from "../models/TutorApplicationStatusHistory.model";
import ApplicationCounter from "../models/ApplicationCounter.model";

export type CanonicalStatus =
  | "APPLICATION_STARTED"
  | "DOCUMENTS_REQUIRED"
  | "APPLICATION_SUBMITTED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "VERIFICATION_IN_PROGRESS"
  | "APPROVED_FOR_MARKETPLACE"
  | "HOME_TUITION_VERIFICATION_REQUIRED"
  | "HOME_TUITION_ELIGIBLE"
  | "REJECTED"
  | "SUSPENDED"
  | "RE_VERIFICATION_REQUIRED";

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
    | "demoVideo";
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
}

export type PublicTrackingPayload = TrackingPayloadBase;

const CANONICAL_LABELS: Record<CanonicalStatus, string> = {
  APPLICATION_STARTED: "Application started",
  DOCUMENTS_REQUIRED: "Documents required",
  APPLICATION_SUBMITTED: "Application submitted",
  UNDER_REVIEW: "Under review",
  ACTION_REQUIRED: "Action required",
  VERIFICATION_IN_PROGRESS: "Verification in progress",
  APPROVED_FOR_MARKETPLACE: "Approved for marketplace",
  HOME_TUITION_VERIFICATION_REQUIRED: "Home tuition verification required",
  HOME_TUITION_ELIGIBLE: "Home tuition eligible",
  REJECTED: "Application rejected",
  SUSPENDED: "Profile suspended",
  RE_VERIFICATION_REQUIRED: "Re-verification required",
};

const PUBLIC_BASE_URL = "https://tutorera.ac.pk";

export function getCanonicalStatusLabel(status: CanonicalStatus): string {
  return CANONICAL_LABELS[status] || status;
}

export function publicTrackingPathFor(applicationId: string): string {
  return `/track/tutor/[secure-token]`;
}

export function publicTrackingUrl(applicationId: string): string {
  return `${PUBLIC_BASE_URL}/track/tutor/[secure-token]`;
}

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
  return Boolean(profile.videoIntro && profile.videoIntroPublicId);
}

export function policeIsRequired(profile: ITutorProfile): boolean {
  return profile.teachingMode === "in-person" || profile.teachingMode === "both";
}

function hasPolice(profile: ITutorProfile): boolean {
  return Boolean(profile.policeCertificate);
}

export function isMarketplaceEligible(profile: ITutorProfile): boolean {
  return Boolean(
    profile.isVerified &&
    profile.onboardingComplete &&
    profile.demoVideoStatus === "approved" &&
    profile.cnicVerificationStatus === "approved" &&
    profile.degreeVerificationStatus === "approved" &&
    profile.verificationStatus === "approved" &&
    !profile.suspendedAt &&
    !profile.reVerificationRequired
  );
}

export function isHomeTuitionEligible(profile: ITutorProfile): boolean {
  if (!policeIsRequired(profile)) return false;
  return isMarketplaceEligible(profile) && profile.policeVerificationStatus === "approved";
}

export function computeProgress(profile: ITutorProfile): { completed: number; total: number; percent: number } {
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
      label: "CNIC verification",
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
      label: "Police verification",
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
      label: "Police verification",
      status: "not_required",
      required: false,
    });
  }

  return items;
}

export function computeCanonicalStatus(profile: ITutorProfile): CanonicalStatus {
  if (profile.suspendedAt) return "SUSPENDED";
  if (profile.reVerificationRequired) return "RE_VERIFICATION_REQUIRED";
  if (profile.verificationStatus === "rejected") return "REJECTED";

  if (isHomeTuitionEligible(profile)) return "HOME_TUITION_ELIGIBLE";

  if (isMarketplaceEligible(profile)) {
    if (policeIsRequired(profile) && profile.policeVerificationStatus !== "approved") {
      return "HOME_TUITION_VERIFICATION_REQUIRED";
    }
    return "APPROVED_FOR_MARKETPLACE";
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
      key: "cnic",
      label: "CNIC verification",
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
      at: at("MARKETPLACE_ACTIVATED"),
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
  const reasons: { key: string; title: string; body: string; cta: { label: string; href: string } }[] = [];
  if (profile.cnicVerificationStatus === "rejected") {
    reasons.push({
      key: "cnic",
      title: "CNIC image needs to be re-uploaded",
      body: profile.cnicRejectionReason || "Your CNIC image could not be verified. Please upload a clearer image.",
      cta: { label: "Upload new CNIC", href: "/onboarding/tutor" },
    });
  }
  if (profile.degreeVerificationStatus === "rejected") {
    reasons.push({
      key: "degree",
      title: "Educational document needs to be re-uploaded",
      body: profile.degreeRejectionReason || "Your educational document was not accepted. Please upload a clearer copy.",
      cta: { label: "Upload new document", href: "/onboarding/tutor" },
    });
  }
  if (profile.demoVideoStatus === "rejected") {
    reasons.push({
      key: "demoVideo",
      title: "Demo video needs to be re-recorded",
      body: profile.demoVideoRejectionReason || "Please record your demo video again in a well-lit environment and clearly introduce the subjects you teach.",
      cta: { label: "Upload new demo video", href: "/onboarding/tutor" },
    });
  }
  if (profile.policeVerificationStatus === "rejected") {
    reasons.push({
      key: "police",
      title: "Police verification needs to be re-submitted",
      body: profile.policeRejectionReason || "Your police verification certificate could not be accepted. Please submit a fresh certificate.",
      cta: { label: "Submit police verification", href: "/onboarding/tutor" },
    });
  }
  if (policeIsRequired(profile) && profile.policeVerificationStatus === "not_submitted") {
    reasons.push({
      key: "policeMissing",
      title: "Police verification required",
      body: "Police verification is mandatory before you can provide Home or In-Person Tuition through TUTORERA.",
      cta: { label: "Submit police verification", href: "/onboarding/tutor" },
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

  const canonicalStatus = computeCanonicalStatus(profile);
  const marketplaceEligible = isMarketplaceEligible(profile);
  const homeTuitionEligible = isHomeTuitionEligible(profile);
  const history = await loadHistory(user._id, false);
  const publicHistory = history;

  const marketplaceBlockReason = (() => {
    if (profile.suspendedAt) return "Your profile is currently suspended.";
    if (profile.reVerificationRequired) return "Re-verification is required before marketplace access resumes.";
    if (!profile.onboardingComplete) return "Complete onboarding to unlock the marketplace.";
    if (profile.cnicVerificationStatus !== "approved") return "CNIC verification is required.";
    if (profile.demoVideoStatus !== "approved") return "Demo video approval is required.";
    if (profile.degreeVerificationStatus === "rejected") return "Educational document was rejected.";
    if (profile.verificationStatus !== "approved") return "Profile approval is pending.";
    return null;
  })();

  const homeTuitionBlockReason = (() => {
    if (!policeIsRequired(profile)) return "Home tuition is not required for your teaching mode.";
    if (homeTuitionEligible) return null;
    if (profile.policeVerificationStatus === "approved") return null;
    if (!profile.policeCertificate) return "Submit your police verification certificate.";
    if (profile.policeVerificationStatus === "pending") return "Police verification is under review.";
    if (profile.policeVerificationStatus === "rejected") return "Police verification was rejected.";
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
      since: profile.marketplaceEligibleAt?.toISOString() || null,
      reasonIfBlocked: null,
    },
    homeTuitionEligibility: {
      eligible: homeTuitionEligible,
      since: profile.homeTuitionEligibleAt?.toISOString() || null,
      reasonIfBlocked: null,
    },
    homeTuitionRequired: policeIsRequired(profile),
    verifiedBadge: false,
    demoVideo: {
      status: "not_submitted",
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

export function tutorDisplayName(fullName?: string, userName?: string): string {
  const source = (fullName && fullName.trim()) || userName || "Tutor";
  return source;
}



