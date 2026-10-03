/**
 * Single source of truth for the tutor application status contract.
 *
 * `scripts/generateFrontendContracts.ts` renders this module into
 * `tutorera-frontend/src/contracts/tracking.contract.ts`, and
 * `tests/tracking-contract.test.ts` fails when the generated file drifts from
 * this definition. Statuses and labels must be added here first, never in a
 * consumer: a status that exists only in the frontend renders as an unknown
 * state, and one that exists only in the backend is displayed as raw text.
 */

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

/** Statuses where the tutor is the one who must act next. */
export const TUTOR_ACTION_STATUSES = [
  "ACTION_REQUIRED",
  "SUBJECT_ELIGIBILITY_REQUIRED",
  "RE_VERIFICATION_REQUIRED",
] as const satisfies readonly CanonicalStatus[];

/** Statuses that end the application rather than describe progress. */
export const TERMINAL_STATUSES = ["REJECTED", "SUSPENDED"] as const satisfies readonly CanonicalStatus[];

/** Statuses where the tutor is live and discoverable on the marketplace. */
export const MARKETPLACE_ACTIVE_STATUSES = [
  "APPROVED_FOR_MARKETPLACE",
  "HOME_TUITION_ELIGIBLE",
] as const satisfies readonly CanonicalStatus[];

/** Statuses where home tuition still needs its own document approval. */
export const HOME_TUITION_PENDING_STATUSES = [
  "HOME_TUITION_VERIFICATION_REQUIRED",
] as const satisfies readonly CanonicalStatus[];

export function getCanonicalStatusLabel(status: CanonicalStatus): string {
  return CANONICAL_STATUS_LABELS[status] || status;
}