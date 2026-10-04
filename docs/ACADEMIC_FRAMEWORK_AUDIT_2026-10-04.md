# Academic Framework Audit — 2026-10-04

## Scope and conclusion

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
