# Academic Framework Audit — 2026-10-04

## Scope and conclusion

> Historical baseline: the opening inventory records the original audit, not the current implementation. Canonical academic models, admin framework pages, and subsequent review safeguards now exist. Use the dated remediation checkpoints below for implementation status; outstanding items must not be inferred solely from the original inventory.

This audit covers the active academic/subject, tutor qualification, subject-approval, matching, and administrative paths. The application already has an enforceable final tutor-subject approval gate, but it does **not** yet have the single canonical academic framework required for production governance.

The immediate architectural fault is a split source of truth:

1. `Subject` is an admin-managed Mongo collection used by `/admin/curriculum`.
2. `MASTER_SUBJECTS` in backend geography config and frontend `lib/location.ts` supplies live pickers, search, onboarding, and geo APIs.
3. `TutorProfile.subjects`, `TutorProfile.subjectEligibility.subject`, `TutorProfile.approvedSubjects`, and `Request.subject` store free-text names.
4. `DisciplineSubjectMap` stores one free-text discipline and arrays of free-text subjects/levels.

The current system must be reconciled, not layered over.

## Existing-state inventory

| Component | Current purpose | Storage/model | Main route/API | Used by | Status | Action |
| --- | --- | --- | --- | --- | --- | --- |
| Curriculum & Subjects | Admin CRUD for subjects | `Subject` | `/admin/curriculum`, `/api/v1/admin/subjects` | Admin page only; seed helper | Partial / disconnected | **REFACTOR** into canonical Subject Catalogue |
| Static subject catalogue | Live picker/search data | `MASTER_SUBJECTS` in backend and frontend config | `/api/v1/geo/*` | onboarding, request UI, search | Active / duplicate | **MIGRATE** into Subject Catalogue; retain a temporary compatibility adapter only |
| Discipline mapping | Qualification-to-subject hint | `DisciplineSubjectMap` | `/admin/discipline-subject-maps`, `/api/v1/tutors/disciplines` | onboarding and eligibility requests | Active / incorrectly modelled | **REFACTOR** into Teaching Eligibility rules |
| Tutor qualifications | Tutor education records | embedded `TutorProfile.education[]` | onboarding step 2 | onboarding, verification | Working / partial | **REUSE + MIGRATE** discipline from string to canonical reference additively |
| Tutor subject request/approval | Per-tutor teaching authorization | embedded `TutorProfile.subjectEligibility[]` | tracking review endpoint | matching, offer/direct-booking checks | Working | **REUSE**, migrate subject/rule/qualification references additively |
| Final marketplace check | Stops unapproved offers/bookings | `subjectEligibility.service.ts` | request/offer/direct-booking flows | matching, offers, acceptance | Working | **KEEP** as the authorization authority; refactor inputs to canonical IDs/codes |

## Evidence-backed findings

### Working and reusable

- Final approval is checked server-side for matching, offers, offer acceptance, and direct booking through `checkSubjectEligibility`; browser changes cannot grant access.
- `approvedSubjects` is a denormalized matching index derived from approved subject-eligibility entries.
- Admin review records reviewer, time, levels, reason, and audit entries.
- An off-discipline approval now requires a documented rationale. This is a useful temporary policy control until evidence attachments and canonical rules exist.
- Tutor education supports more than one record, and current request creation checks all declared discipline strings.

### Incorrect, incomplete, or duplicated

- `Subject` has no stable `code`, no category relation, no archive state, no CSV workflow, and destructive deletion via `findByIdAndDelete`.
- There is no `SubjectCategory` or canonical `AcademicDiscipline` collection.
- `DisciplineSubjectMap` combines a discipline catalogue and a many-to-many eligibility rule in one document, uses free-text names, only represents direct eligibility, and cannot express `CONDITIONAL`, required evidence, or degree level.
- `MASTER_SUBJECTS` is duplicated between backend and frontend. It is currently the live catalogue, so changing `/admin/curriculum` does not reliably change marketplace behaviour.
- `Request.subject` and tutor subject fields are strings. Historical snapshots are valid, but active relationships cannot enforce referential integrity or safe rename/deactivation.
- `/admin/curriculum` is misleadingly named and `/admin/discipline-subject-maps` overlaps conceptually in navigation.
- Existing admin permission is broad (`market.configure`); no academic-framework-specific permission family exists.
- No CSV templates, dry run, transactional import, row-level diff, import history, formula-injection protection, bulk status controls, or export functionality exists.
- The mapping page permits hard deletion, which risks making past qualification decisions hard to interpret.
- Public/geo search and tutor onboarding can still consume static subjects, so a database-only refactor without compatibility routing would create outages.

## Target source-of-truth ownership

| Domain | Target authority | Compatibility rule during migration |
| --- | --- | --- |
| Subject categories | `SubjectCategory` | none exists today |
| Subjects | `Subject` with immutable `code` | name/slug retained as historical display snapshots |
| Disciplines | `AcademicDiscipline` | map legacy discipline strings by normalized name |
| Teaching eligibility | `TeachingEligibilityRule` | migrate `DisciplineSubjectMap` arrays to one rule per subject |
| Tutor qualification | embedded education entry with additive discipline reference | retain current degree/institution strings |
| Tutor subject request/approval | existing embedded `subjectEligibility[]`, extended with subject/rule/qualification references | retain subject display name for history |
| Marketplace authorization | `subjectEligibility.service.ts` | continue rejecting non-approved subject-level requests throughout migration |

## Safe migration plan

1. Inventory all `Subject`, `DisciplineSubjectMap`, tutor education, tutor eligibility, request, offer, and booking values; report duplicates, unmapped values, and historical references without changing data.
2. Add canonical category, discipline, and eligibility-rule collections plus additive reference/code fields. Do not remove free-text snapshots.
3. Seed/migrate `Subject` from the effective static catalogue, assigning stable codes; reconcile existing admin rows by normalized slug/name.
4. Migrate legacy maps into rule rows (`DIRECT` initially). Do not infer conditional rules; flag them for academic administration.
5. Backfill education discipline references and tutor-subject request references only where matching is unambiguous. Leave ambiguous rows flagged, non-escalating, and reviewable.
6. Route live catalogue reads through a compatibility adapter backed by canonical active subjects; only remove static arrays after parity tests and production reconciliation.
7. Add the Academic Framework route namespace and aliases/redirects for legacy URLs.
8. Add dry-run CSV import/export and migration ledger before bulk production changes.

## Required implementation order

1. Canonical schemas, indexes, validation, permission mapping, and inventory/dry-run migration tooling.
2. Subject Catalogue and Academic Disciplines APIs with safe deactivate/archive semantics.
3. Teaching Eligibility Rules engine (`DIRECT`, `CONDITIONAL`, `UNMAPPED`) and compatibility adapter for legacy maps.
4. Qualification verification-aware subject request service, including multiple verified qualifications and evidence attachments for conditional requests.
5. Move all onboarding/request/search selectors to canonical active subjects; retain display snapshots.
6. Academic Framework admin navigation, legacy route redirects, overview, subject/disciplines/rules/tutor approvals pages.
7. CSV templates, strict dry-run/import preview, transactional commit, import history, and safe exports.
8. Marketplace/API/IDOR/race regression suite, production data reconciliation, then removal of proven redundant static sources.

## Non-negotiable safeguards

- No automatic approval from a qualification or eligibility rule.
- No offer, direct booking, acceptance, or matching based only on self-declared subjects.
- No hard deletion of referenced academic records.
- No CSV relation based on Mongo IDs.
- No mass-update import without an explicit dry run and confirmation token.
- No removal of legacy fields until migration reports and compatibility tests prove safe.

## Files most directly affected

- `tutorera-backend/src/models/Subject.model.ts`
- `tutorera-backend/src/models/DisciplineSubjectMap.model.ts`
- `tutorera-backend/src/models/TutorProfile.model.ts`
- `tutorera-backend/src/controllers/subject.controller.ts`
- `tutorera-backend/src/controllers/disciplineSubjectMap.controller.ts`
- `tutorera-backend/src/services/subjectEligibility.service.ts`
- `tutorera-backend/src/services/matching.service.ts`
- `tutorera-backend/src/controllers/geo.controller.ts`
- `tutorera-frontend/src/app/admin/curriculum/page.tsx`
- `tutorera-frontend/src/app/admin/discipline-subject-maps/page.tsx`
- `tutorera-frontend/src/app/onboarding/tutor/page.tsx`
- `tutorera-frontend/src/lib/location.ts`
- `tutorera-frontend/src/lib/geoService.ts`

## Known product decision required before data seeding

Academic owners must approve the initial discipline-to-subject rules. For example, a BDS/Dentistry qualification should not receive a direct Pakistan Studies rule. It can only receive a conditional review path when independently submitted evidence meets the approved policy.

## Qualification-review remediation checkpoint — 4 October 2026

- Admin application detail now provides an individual review card for every education entry: document viewing, verified degree level, approval, rejection with a required specific reason, and return to pending. Qualifications are excluded from generic bulk approval.
- Tutor application tracking displays the same per-qualification decisions, degree levels, review dates, feedback, and education correction links. It refreshes on window focus and every 30 seconds while visible.
- Credential reviews are fingerprint-bound to their education/document details. Unchanged self-service saves preserve server-owned reviews; changed credentials cannot reuse a previous review for a new subject approval.
- Subject approval requires a currently reviewed qualification and an active matching rule. Unmapped subjects cannot be approved simply by uploading evidence and adding a rationale. Minimum-degree requirements use admin-verified ranks and unknown ranks fail closed.
- API: the existing degree-review operation accepts `qualificationIndex` (defaults to 0 for compatibility) and `verifiedDegreeLevel`; private degree-document viewing accepts `qualificationIndex` as a query parameter.
- Browser regression checks passed for mandatory rejection reasons, targeting the second qualification, persisting success feedback, tutor-only read access, correction links, and focus-triggered status refresh. These tests mock API responses and do not prove production/database behavior.
- Frontend type checking and targeted lint passed (one existing image-optimization warning). Backend build passed. The first concurrent production-build attempt exhausted memory; the sequential retry completed. The final interaction fix was verified against a development server.
- Still required: a safe review/backfill strategy for legacy qualifications, explicit evidence-level review decisions, concurrency-safe review persistence, atomic audit tracking, complete multi-qualification onboarding/resubmission, and production smoke tests. Existing active tutor approvals are not retroactively revalidated by this checkpoint.

## Explicit subject-evidence review checkpoint — 4 October 2026

- Added pending/approved/rejected evidence decisions, reviewer references, review dates, reasons, and reviewed-document binding. Uploading a file no longer satisfies a conditional rule until an administrator approves that specific file.
- Added permission-protected `PATCH /api/v1/tracking/admin/applications/:id/subject-eligibility/:subject/evidence/:index` with a mandatory document-specific reason. Evidence decisions are immutable; rejected files remain in the record when replacement evidence is uploaded.
- Closed subject requests cannot receive new evidence decisions. Rejected evidence moves the request to `needs_evidence` when no approved or pending file remains; approved evidence returns it to pending subject review, never to approved teaching status.
- Admin and tutor screens show individual evidence status, feedback, and review dates. Tutor upload inputs are keyboard accessible, exclude closed requests, and keep upload failures local instead of replacing the entire tracking page.
- Added evidence audit/status events and used the existing verification notification flow. Review reasons are excluded from public-token history for this new event.
- Validation: 47 targeted backend tests passed; backend build, frontend type check, and targeted lint passed (one existing image warning). Two mocked-API browser workflows passed, covering evidence reasons/decisions, tutor-only read access, and replacement-upload availability. This is not a production or live-provider verification.
- Remaining: legacy qualification reconciliation, cross-country review authorization, optimistic concurrency and atomic review/audit persistence, complete multi-qualification onboarding/resubmission, and production smoke tests.

## Transactional evidence-decision checkpoint — 4 October 2026

- Subject-evidence decisions now reload the current application inside a MongoDB transaction and commit the decision, strict audit row, and private tracking-history row together. Audit/history write failures roll back the decision instead of being swallowed.
- Conflicting simultaneous evidence decisions result in one committed decision and one HTTP 409 conflict; closed or already-reviewed evidence cannot be overwritten by the losing request.
- Added reviewer identity references to tracking history; older rows remain readable. Verification notifications run after commit, outside the retryable transaction callback.
- Four database-backed regression cases cover successful commit, audit-write rollback, history-write rollback, and simultaneous contradictory decisions. All 51 tests in the four targeted suites passed; backend TypeScript build passed.
- Requires a MongoDB replica set or sharded cluster; there is deliberately no unsafe standalone fallback. Qualification decisions and final subject approvals/revocations still require equivalent transactional remediation. Notification delivery is not yet an atomic outbox guarantee. Legacy qualification reconciliation and country-scope authorization also remain pending.

## Transactional qualification-review checkpoint — 4 October 2026

- Individual qualification decisions, aggregated education status/rejection reasons, degree-review queue, admin review records, audit records, and private tutor history now commit together in a MongoDB transaction. Returning a qualification to pending is also recorded.
- A credential-and-review snapshot token prevents simultaneous conflicting requests from overwriting a changed qualification. This server-captured token does not yet protect against sequential submissions from a stale browser; client-supplied review versions remain a follow-up.
- Approving one qualification no longer clears another qualification's rejection reason. The aggregate review queue retains all outstanding qualification rejection reasons.
- Validation: five new database-backed regression cases cover successful commit, complete rollback on history failure, conflicting concurrent reviews, retained rejection reasons, and return-to-pending history. All 56 tests across five targeted suites passed; backend TypeScript build passed.
- Pending: transactional final subject approval/revocation, post-commit notification outbox and activation consistency, legacy reconciliation, country-scoped authorization, multi-qualification resubmission, and production smoke tests. No commit, push, or deployment performed in this checkpoint.

## Transactional subject-decision checkpoint — 4 October 2026

- The admin subject review endpoint now commits approval/rejection/revocation, denormalized approved subjects, strict audit records, and private tracking history together. Revocation's affected-booking flags are included in that same transaction and do not cancel bookings.
- Review snapshots include the target subject entry and education credentials; concurrent conflicting decisions return HTTP 409 instead of silently overwriting. Snapshot serialization is stable across MongoDB property ordering. Browser-supplied review versions remain pending.
- Eligibility-rule and qualification reads use the transaction session. Revocation requires an approved entry and an explicit subject-specific reason. Subject names in affected-request lookup are escaped as literals.
- Added five database-backed tests covering approval/history, audit failure rollback, conflicting decisions, revocation/booking-flag rollback and successful retry, and invalid revocation. Corrected an older revocation fixture that never checked whether its prerequisite approval succeeded.
- Validation: 61 tests across six targeted suites passed; backend TypeScript build passed. Requires transactional MongoDB; no standalone fallback or production smoke test performed.
- Still pending: post-commit activation/notification reliability, legacy approval reconciliation, country-scope authorization, complete multi-qualification resubmission, client-side stale-review protection, and coordination with concurrent academic-rule edits. No commit, push, or deployment performed.

## Post-review synchronization checkpoint — 4 October 2026

- Activation synchronization now reloads the persisted application and tutor account rather than relying on pre-review controller snapshots. Deleted, banned, and suspended accounts cannot be activated through document/subject review. The caller's response receives the synchronized profile without saving its stale snapshot.
- Added a defensive best-effort review-notification boundary with sanitized failure logging. The underlying notification service already catches most delivery failures; this boundary is not an outbox, retry mechanism, or proof of delivery.
- Four new tests verify current snapshot reads, missing-record failures, successful notification delegation, and failure isolation without sensitive logging. All 65 tests across eight focused suites passed; final backend build passed.
- Pending: activation changes are still multiple writes rather than a transaction with the review; concurrent moderation remains a race to address. Durable notification retries/outbox, current-credential activation enforcement and legacy reconciliation, full endpoint synchronization tests, and production smoke tests remain. No deployment or commit performed.

## Atomic agreement issuance checkpoint — 4 October 2026

- Post-review agreement creation now reloads the current application/account inside a transaction and commits the agreement, acceptance-required flags, strict audit record, and private tracking history together. Notifications remain outside the retryable callback.
- Simultaneous issuance through this service is serialized by the profile write; the retry finds the existing pending/active agreement and does not issue a duplicate. Missing document/subject approval and blocked accounts cannot issue an agreement.
- Added four database-backed tests for issuance/idempotency, audit failure rollback, simultaneous issuance, and blocked-account/missing-subject gates. All 69 targeted tests across nine suites passed; backend TypeScript build passed.
- This covers the post-review issuance path, not every possible agreement writer. Broader activation/profile/account transitions remain non-atomic, and concurrent moderation/rule edits require additional coordination. Durable delivery retries, legacy credential reconciliation, and production smoke tests remain pending. No commit, push, or deployment performed.

## Atomic review-visibility checkpoint — 4 October 2026

- Post-review marketplace/home visibility flags, timestamps, account lifecycle, strict audit, and private activation/deactivation history now commit together using fresh transactional reads. Notifications are emitted only after this visibility commit.
- Suspended/banned/deleted accounts are excluded. Deactivation clears visibility timestamps. Lifecycle drift is repaired even when visibility flags are already correct, without duplicating activation history. Strict visibility updates deliberately avoid the legacy profile-save grandfathering bypass.
- Four database-backed tests cover activation/idempotency, audit failure rollback across profile/account/history, suspended-account deactivation, and lifecycle drift repair. All 73 targeted tests across ten suites passed; backend TypeScript build passed.
- Scope: this fixes the post-review visibility path. Review decisions, profile-wide approval, agreement issuance, and visibility still use separate transaction units; other activation writers and moderation/rule-edit coordination need further audit. Durable notifications, current-credential/legacy reconciliation, broader endpoint tests, and production smoke tests remain pending. No commit, push, or deployment performed.

## Central activation session checkpoint — 4 October 2026

- Fixed the central activation helper's partial-session behavior: user/profile, legal-agreement and acceptance reads now use the supplied session, and account lifecycle writes participate in it. Session operations run sequentially.
- Calls without a session now create an activation transaction. Agreement lookup inside a transaction does not auto-seed outside that transaction; published agreements must be provisioned beforehand. Normal nontransactional agreement lookup retains its existing seeding behavior.
- Two new database-backed tests verify visibility of an uncommitted rejection, rollback of profile/account changes, and standalone activation synchronization. All 25 tests across activation-session, agreement-activation and eligibility-authority suites passed; backend build passed.
- Remaining: agreement acceptance itself still writes acceptance, legacy contract, profile, activation and audit in separate units. Central activation still needs consistent home-visibility/history handling and strict legacy-bypass reconciliation. Notification retries, broad endpoint audits, and production smoke tests remain pending. No commit, push, or deployment performed.

## Atomic agreement acceptance checkpoint — 4 October 2026

- Agreement acceptance now commits superseding prior acceptances, immutable signature/consent snapshots, legacy agreement update, profile acceptance fields, central activation/account updates, strict audit, and private tracking history in one transaction. The profile write serializes concurrent signing; the callback rechecks existing acceptance and published content hash.
- Post-commit socket delivery failures no longer convert a committed signature into a failed API response. Responses and notification copy use actual activation results instead of unconditionally claiming the tutor is active.
- Added an API regression injecting audit failure and confirming signature/profile/activation rollback. All 15 agreement API/PDF tests passed; the preceding activation-session plus agreement run also passed (16 tests before adding the new case). Backend TypeScript build passed.
- Remaining: stale/country-specific agreement selection, concurrent-signing endpoint coverage, moderation/profile prerequisite revalidation during signing, central home-visibility/history alignment, legacy credential reconciliation, durable notification retries, and production smoke tests. No commit, push, or deployment performed.

## Signing eligibility checkpoint — 4 October 2026

- Agreement selection now resolves the current applicable tutor agreement; a supplied non-current or wrong-market ID returns HTTP 409 instead of silently substituting or accepting another published agreement.
- Mandatory consents require literal boolean true. String values, including `"false"`, are rejected. The signing transaction rechecks current account moderation, onboarding, document/subject approvals, verified legal name, applicable agreement ID, and content hash before recording a new signature.
- Added three API regressions for non-current IDs, string consent, and missing subject approval. All 18 agreement API/PDF tests passed; backend TypeScript build passed.
- Remaining: browser-supplied content hash/version binding, explicit wrong-country agreement fixtures, concurrent-signing endpoint coverage, coordination with moderation/rule edits after snapshot reads, strict per-credential and legacy reconciliation, central home visibility/history alignment, durable notifications, and production smoke tests. No commit, push, or deployment performed.

## Reviewed-content binding checkpoint — 4 October 2026

- Agreement acceptance requires `agreementHash` matching the exact current content and applicable schedule. The current-agreement response computes this hash from the returned content, and the tutor signing page sends it with the agreement ID. Missing/stale hashes return HTTP 409 before any signature is written.
- Added stale-content rejection and simultaneous-signing API tests. Concurrent requests return the same acceptance ID with one active acceptance and one acceptance audit record. All 20 agreement API/PDF tests passed; backend build and frontend type checking passed. No browser or production build verification performed this checkpoint.
- Deployment must coordinate the signing frontend/backend change: old clients lacking `agreementHash` will be asked to reload. No fallback accepts unbound signatures.
- Remaining: explicit wrong-market fixtures, frontend stale-conflict recovery/browser coverage, coordination with concurrent moderation/rule edits, per-credential/legacy reconciliation, central home-visibility/history alignment, durable notification retries, and production smoke tests. No commit, push, or deployment performed.

## Stale-signature recovery checkpoint — 4 October 2026

- The tutor agreement page clears signature, all consents, and old agreement/execution state on HTTP 409, then fetches current terms. Signing requires the new agreement ID/hash and newly entered consent/signature; there is no automatic signing retry.
- If current terms cannot be fetched, the page shows a load failure and cannot sign against the discarded agreement.
- Frontend type checking passed; targeted lint passed with three existing unused-variable warnings. Added a mocked-API Playwright regression for old-hash submission, replacement terms, cleared consents/signature, and disabled re-signing. That browser regression has not yet been executed.
- Pending: browser execution including failed-refresh coverage, explicit wrong-market fixtures, concurrent moderation/rule coordination, legacy credential reconciliation, central home visibility/history alignment, durable delivery, and production smoke tests. No commit, push, or deployment performed.

## Agreement browser verification checkpoint — 4 October 2026

- Browser execution exposed a TutorGuard circular dependency: `/tutor/accept-agreement` required marketplace eligibility even though eligibility requires acceptance. Authenticated tutors can now reach this exact signing route before activation; backend signing prerequisites remain enforced and other marketplace routes remain protected.
- Both mocked-API Chromium tests passed: replacement terms clear signatures/consents and disable signing; failed replacement fetch removes signing controls and displays the recovery error. Fixtures account for development Strict Mode repeat reads.
- Frontend type checking and targeted guard/test lint passed. Test dev server was stopped and temporary Playwright configuration removed. No production build or live-service verification performed.
- Pending: wrong-market API fixtures, non-tutor guard regression, central home-visibility/history alignment, current-credential/legacy reconciliation, durable notification delivery, and production smoke tests. No commit, push, or deployment performed.

## Market/version signing verification checkpoint — 4 October 2026

- Agreement signing now requires a nonempty agreement ID as well as the reviewed content hash, binding consent to the specific current agreement record/version.
- Added a real published UAE agreement fixture: a PK tutor cannot sign that ID. Added missing-ID rejection coverage. All 22 agreement tests passed; backend TypeScript build passed.
- Agreement acceptance history now uses `TUTOR_AGREEMENT_ACCEPTED`, not `PROFILE_APPROVED`, distinguishing tutor consent from an administrator's approval. The simultaneous-signing regression also asserts exactly one acceptance history event.
- Pending: non-tutor browser guard regression, current-credential/legacy reconciliation, central home-visibility/history alignment, durable notification delivery, concurrent moderation/rule coordination, and production smoke tests. Changes remain local; no commit, push, or deployment performed.

## Central visibility/history alignment checkpoint — 4 October 2026

- Central activation now synchronizes home-tuition visibility alongside marketplace visibility, clears stale activation timestamps, and records private visibility-transition history and strict activation audits inside the caller/owned transaction.
- Ineligible accounts left as verified are downgraded to submitted; explicitly rejected applications retain rejected account status. Repeated synchronization does not duplicate visibility-transition history.
- Added deactivation/timestamp/idempotency and history-failure rollback regressions. Activation/agreement/eligibility suites passed 34 tests before adding the final rollback test; all four activation-session tests then passed. Backend TypeScript build passed.
- Pending: strict current-credential/legacy reconciliation, non-tutor browser guard regression, durable delivery, concurrent moderation/rule coordination, central/post-review policy consolidation, and production smoke tests. No commit, push, or deployment performed.

## Qualification-dependent subject reset checkpoint — 4 October 2026

- Rejecting or returning a qualification to pending now resets approved subjects explicitly linked to that qualification index to pending, clears their approved teaching levels, and updates approvedSubjects in the same review transaction.
- Each dependent reset has a strict audit record and private tutor/admin tracking event. Correcting or reapproving the qualification does not automatically restore subject approval; a fresh administrator decision is required. Other qualification-linked subjects remain unchanged.
- Added a regression covering targeted invalidation and audit/history. All 44 tests across qualification-decision, subject-decision and subject-eligibility suites passed; backend TypeScript build passed.
- Scope limitations: legacy approvals without qualification links are not changed; education replacement/reordering still needs fingerprint-bound subject reconciliation; affected existing bookings still need a review-flag workflow for this reset path. Durable reminders, legacy reconciliation, policy consolidation, and production smoke tests remain pending. No commit, push, or deployment performed.

## Education-edit reconciliation checkpoint — 4 October 2026

- General tutor profile education edits reconcile subject qualification indexes by credential fingerprint. Reordering unchanged reviewed credentials preserves their subject links; removing/replacing supporting credentials resets approved subjects and teaching levels instead of transferring approval to another array occupant.
- Reconciled subjects and approvedSubjects are saved with education. Education edits now trigger visibility synchronization, not only teaching-mode edits. Reset reasons are written to private tracking history and audit using the existing post-save logging path.
- Three reconciliation cases plus qualification suites passed 15 tests; final backend TypeScript build passed. These are service-level fixtures, not full profile-update API/browser verification.
- Pending: make self-service education save and reset audit/history atomic; apply reconciliation across onboarding/resubmission and all alternate education writers; affected-booking flags; legacy unlinked approvals; runtime rule changes and strict qualification gating; production smoke tests. No commit, push, or deployment performed.

## Primary onboarding credential preservation checkpoint — 4 October 2026

- Onboarding education step edits qualification zero without discarding additional education entries. Unchanged credentials retain server-owned reviews; replacement credentials return to pending. Changed discipline text no longer retains an unrelated canonical discipline reference.
- The step reconciles linked subject approvals, synchronizes visibility, and refreshes the document review queue. Aggregate education rejection reasons retain outstanding feedback on other qualifications.
- Removed deletion of the previous primary degree file before successful replacement persistence. Historical file cleanup now needs a retention-aware maintenance policy; no existing files were deleted in this checkpoint.
- Added preservation/review-reset regression; all 10 qualification/reconciliation tests passed and backend build passed. Full onboarding API/browser verification remains pending.
- Remaining: alternate upload/admin resubmission writers, qualification-specific multi-entry wizard UX, atomic save/audit/notification workflow, affected-booking flags, legacy reconciliation, and production smoke tests. No commit, push, or deployment performed.

## Alternate degree-upload reconciliation checkpoint — 4 October 2026

- Tutor verification upload, admin verification upload, and admin application on-behalf degree upload now share primary-credential replacement logic: preserve additional qualifications, clear the uploaded credential's old review, reconcile linked subjects, and retain other qualification rejection feedback.
- Admin upload no longer automatically approves replacement degrees. They require explicit qualification review. The on-behalf route ignores autoApprove for degree documents while retaining existing behavior for other document types.
- Previous degree files are no longer queued for immediate deletion in the two verification upload paths; retention-aware cleanup remains pending.
- Shared replacement/qualification suites passed 12 tests; backend TypeScript build passed. Full multi-entry upload UI and atomic replacement audit/history remain pending.
- Remaining: affected-booking flags, qualification-specific upload selectors, non-atomic self-service/reset tracking, legacy approvals, durable delivery, and production smoke tests. No commit, push, or deployment performed.

## Indexed uploads and booking-review checkpoint — 4 October 2026

- All three replacement degree-upload APIs accept an optional qualificationIndex, validate it before uploading, and preserve other credentials and their reviews. Omitted indexes retain primary-credential compatibility.
- Qualification rejection/reset flags the affected tutor's upcoming and ongoing bookings for review inside the review transaction. General profile education edits also flag affected bookings after persistence. Bookings are never automatically cancelled.
- Literal subject matching prevents regex metacharacters from widening the booking selection. Regression fixtures verify tutor/status isolation and transactional rollback.
- Removed overall application auto-approval from the legacy admin document-upload path. Uploading replacement evidence now disables visibility pending review.
- Six targeted suites passed 42 tests. Backend TypeScript build is checked separately. These tests do not establish complete end-to-end coverage or production readiness.
- Still pending: qualification-selection UI; booking flags in onboarding and alternate uploads; atomic self-service edits, history and notifications; legacy unlinked approval reconciliation; durable notification delivery; activation-policy consolidation; full frontend build and production smoke tests. No commit, push, migration or deployment performed.

## Unified visibility evaluation and upload flag coverage — 4 October 2026

- Review-driven visibility now calls evaluateTutorActivation in its transaction, sharing central onboarding, document, subject, agreement/consent and account eligibility criteria. It also synchronizes tutorStatus. The separate visibility write orchestration remains; further consolidation is not claimed.
- Tutor verification uploads, admin uploads, on-behalf uploads and onboarding persistence now flag bookings for subject approvals reset by qualification reconciliation. Ordinary pending subject requests are excluded. These calls are post-save and still need an atomic save/flag/audit unit with retry-safe failure handling.
- Added incomplete-onboarding activation and pending-reset booking-filter regression cases. Backend TypeScript build passed.
- Remaining: atomic self-service and other document reviews; multi-qualification tutor UI; safe legacy reconciliation; durable notification outbox; concurrent academic-policy coordination; full API/browser and production verification. Legacy agreement acceptance compatibility is retained, not silently revoked.
- No commit, push, migration or deployment performed.

## Atomic education edits and multi-qualification onboarding — 4 October 2026

- Tutor self-service education edits now persist the profile update, affected-booking review flags, immutable status history and audit records in one MongoDB transaction. A history failure rolls the profile and booking flag back.
- The tutor education step can now select every stored qualification or append a new one. The selected index is sent to the onboarding endpoint; backend validation permits append only on onboarding, while replacement APIs remain restricted to existing credentials.
- This UI intentionally does not imply approval: each qualification and any linked teaching subject remains pending until a reviewer approves it.
- Focused persistence/replacement tests passed and the sequential backend and frontend production builds passed. Next.js emitted pre-existing middleware/edge-runtime deprecation warnings.
- Still pending: safe legacy unlinked-approval reconciliation; durable notification outbox/retries; full cross-controller transaction coverage; browser/API E2E journey tests and production smoke verification. No commit, push, migration or deployment performed.

## Durable application email delivery — 4 October 2026

- Email sends now create a durable outbox job and one EmailLog entry before contacting the provider. Provider failure preserves the queued job, schedules bounded exponential retry, and never creates duplicate log rows on retry.
- A lease-protected email-outbox scheduled job runs every five minutes and is recorded in existing job-health observability. Outbox message bodies expire after seven days; delivery metadata remains in EmailLog.
- Focused tests cover initial delivery, provider failure, retry recovery and scheduled-job observability.
- Remaining: a protected admin retry/inspection interface, webhook-driven outbox terminal-state reconciliation, legacy unlinked-approval migration, broader controller transaction coverage, and real API/browser production smoke verification. No commit, push, migration or deployment performed.

## Email-delivery administration checkpoint — 4 October 2026

- Admin Email Logs now display retained outbox state, retry count, next attempt and a per-message retry action. The action is available only for failed/queued persisted deliveries and requires growth.manage; it cannot compose or resend arbitrary content.
- Retrying resets the existing retained job, writes an audit entry, and attempts the same immutable payload. If the provider remains unavailable, the scheduled worker retains responsibility for retry.
- Backend and frontend production builds passed. Existing Next middleware/edge-runtime deprecation warnings remain outside this change.
- Remaining: webhook-to-outbox terminal reconciliation, legacy unlinked-approval migration, broader controller transaction coverage, admin API integration coverage, and production smoke verification. No commit, push, migration or deployment performed.

## Safe legacy subject-approval reconciliation — 4 October 2026

- Added `npm run academic:reconcile-legacy-approvals`, a dry-run-first migration for historical approved subject entries without qualification links. It links only a single current reviewed qualification with a single active direct canonical rule for that subject.
- Ambiguous and unmatched entries are reported and deliberately left unchanged. The migration does not approve, revoke, alter levels, or change marketplace access.
- Writes require both `--commit` and `--confirm=LINK_LEGACY_SUBJECT_APPROVALS`; this production data migration has not been run.
- Backend TypeScript build passed. Remaining: review the dry-run report with academic administrators, separately resolve its exceptions, webhook/outbox reconciliation, wider controller transaction coverage, integration tests, and production smoke verification. No commit, push, migration or deployment performed.

## Provider webhook and outbox convergence — 5 October 2026

- Resend webhook state changes now synchronize to the durable EmailOutbox. Sent, delivered and opened events close delivery as sent; bounced and failed events make the outbox terminal so the retry worker cannot resend a provider-rejected address.
- Webhook signature protections remain unchanged. Targeted webhook-security and outbox tests passed, and the backend TypeScript build passed.
- The legacy subject-approval reconciliation completed against Atlas on 5 October 2026. It scanned zero eligible profiles and made no changes; no legacy approved-subject rows required linking.
- Remaining: broader controller transaction coverage, authenticated admin API retry integration coverage, real browser/API journey tests, and production smoke verification.
