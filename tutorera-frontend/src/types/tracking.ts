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
  key: "personal" | "education" | "experience" | "profile" | "cnic" | "police" | "demoVideo";
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
  event: string;
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
  trackingTokenMeta: { createdAt: string | null; rotatedAt: string | null };
  actionRequired: ActionRequired | null;
  publicTrackingPath: string;
  trackingToken?: string;
}

export type PublicTrackingPayload = TrackingPayloadBase;

export interface AdminApplicationRow {
  _id: string;
  applicationId?: string;
  tutorName?: string;
  tutorEmail?: string;
  tutorUserId?: string;
  canonicalStatus: CanonicalStatus;
  submittedAt: string;
  lastUpdated: string;
  progress: number;
  marketplaceEligible: boolean;
  homeTuitionEligible: boolean;
  homeTuitionRequired?: boolean;
  teachingMode?: "online" | "in-person" | "both";
}
