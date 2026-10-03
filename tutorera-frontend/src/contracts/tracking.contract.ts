// AUTO-GENERATED — do not edit by hand.
// Source: tutorera-backend/src/contracts/tracking.contract.ts
// Regenerate: npm run contracts:generate --prefix tutorera-backend

export const CANONICAL_STATUSES = [
  "APPLICATION_STARTED",
  "DOCUMENTS_REQUIRED",
  "APPLICATION_SUBMITTED",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "VERIFICATION_IN_PROGRESS",
  "SUBJECT_ELIGIBILITY_REQUIRED",
  "APPROVED_PENDING_AGREEMENT",
  "AGREEMENT_PENDING",
  "AGREEMENT_REACCEPTANCE_REQUIRED",
  "APPROVED_FOR_MARKETPLACE",
  "HOME_TUITION_VERIFICATION_REQUIRED",
  "HOME_TUITION_ELIGIBLE",
  "REJECTED",
  "SUSPENDED",
  "RE_VERIFICATION_REQUIRED",
] as const;

export type CanonicalStatus = (typeof CANONICAL_STATUSES)[number];

export const CANONICAL_STATUS_LABELS: Record<CanonicalStatus, string> = {
  APPLICATION_STARTED: "Application started",
  DOCUMENTS_REQUIRED: "Documents required",
  APPLICATION_SUBMITTED: "Application submitted",
  UNDER_REVIEW: "Under review",
  ACTION_REQUIRED: "Action required",
  VERIFICATION_IN_PROGRESS: "Verification in progress",
  SUBJECT_ELIGIBILITY_REQUIRED: "Teaching subject approval required",
  APPROVED_PENDING_AGREEMENT: "Application approved — Agreement pending",
  AGREEMENT_PENDING: "Agreement acceptance required",
  AGREEMENT_REACCEPTANCE_REQUIRED: "Updated agreement reacceptance required",
  APPROVED_FOR_MARKETPLACE: "Approved for marketplace",
  HOME_TUITION_VERIFICATION_REQUIRED: "Home tuition verification required",
  HOME_TUITION_ELIGIBLE: "Home tuition eligible",
  REJECTED: "Application rejected",
  SUSPENDED: "Profile suspended",
  RE_VERIFICATION_REQUIRED: "Re-verification required",
};

export const TUTOR_ACTION_STATUSES = [
  "ACTION_REQUIRED",
  "SUBJECT_ELIGIBILITY_REQUIRED",
  "RE_VERIFICATION_REQUIRED",
] as const satisfies readonly CanonicalStatus[];

export const TERMINAL_STATUSES = [
  "REJECTED",
  "SUSPENDED",
] as const satisfies readonly CanonicalStatus[];

export const MARKETPLACE_ACTIVE_STATUSES = [
  "APPROVED_FOR_MARKETPLACE",
  "HOME_TUITION_ELIGIBLE",
] as const satisfies readonly CanonicalStatus[];

export const HOME_TUITION_PENDING_STATUSES = [
  "HOME_TUITION_VERIFICATION_REQUIRED",
] as const satisfies readonly CanonicalStatus[];

export function getCanonicalStatusLabel(status: CanonicalStatus): string {
  return CANONICAL_STATUS_LABELS[status] || status;
}
