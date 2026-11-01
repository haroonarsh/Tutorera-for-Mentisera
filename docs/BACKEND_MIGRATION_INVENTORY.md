# Backend migration inventory — TUTORERA

Source of truth: `tutorera-backend/src/` on `main` (inventory inspected 2026-10-31).
This document inventories files; it **does not certify endpoint behavior**.

## Existing boundaries

- Express HTTP composition: `app.ts` mounts routes at `/api/v1`.
- Node server/runtime: `server.ts` owns Socket.IO, MongoDB boot, timers and shutdown.
- Persistence: 43 model files in `models/`; **retain schema and data** until separately reviewed.
- Domain services: 21 files in `services/`; extract business logic without changing outcomes.

## Route modules

`admin`, `ai`, `auth`, `blog`, `booking`, `chat`, `contact`, `earnings`, `geo`, `guarantee`, `liquidity`, `location`, `matching`, `meeting`, `notification`, `offer`, `parent`, `payment`, `pricing`, `public`, `referral`, `request`, `review`, `student`, `tracking`, `tutor`, `tutoringIndex`, `upload`, `webhook`.

## Risk-first extraction sequence

| Wave | Modules | Guardrail |
|---|---|---|
| 0 | MongoDB staging spike | Driver build + isolated Atlas read/write/rollback, no production traffic |
| 1 | public, tutoringIndex, geo, location, pricing | Read-only parity, no exposure of private records |
| 2 | auth, student, tutor, parent | Preserve session semantics, age/guardian consent, access control |
| 3 | request, offer, matching, availability | Preserve status transitions, prevent double acceptance |
| 4 | booking, meeting, chat, notification | Enforce ownership and ordering, verify WebSocket compatibility |
| 5 | payment, webhook, earnings, guarantee | Signature verification, idempotency, reconciliation, audit trail |
| 6 | admin, uploads, analytics and auxiliary routes | Fine-grained roles, private R2 files, audit logging |
| 7 | recurring jobs | Cron + Queue design with distributed leases and idempotent retries |

## Domain models requiring special protection

- Money: `PaymentLedger`, `RefundRequest`, `FeeConfig`, `TaxConfig`, `PayoutReport`.
- Booking and negotiation: `Booking`, `BookedSlot`, `Request`, `Bid`, `OfferNegotiation`.
- Identity and safety: `User`, `TutorProfile`, `StudentProfile`, `GuardianConsent`, `SafetyCase`, `AuditLog`.
- Messaging: `Conversation`, `Message`, `Notification`.
- Job exclusivity: `JobLease`.

## Required proof before each wave is merged

1. Capture existing route methods, schemas, error codes, authentication, and side effects.
2. Add contract tests against existing Express behavior.
3. Build new adapter behind feature flag; avoid dual writes.
4. Test staging with synthetic accounts and separate MongoDB database.
5. Demonstrate rollback, monitoring, and failure-mode behavior.
6. Obtain explicit cutover approval before production DNS or backend retirement.

## Explicitly not verified

The route file list does not establish that endpoints work, that MongoDB connectivity is healthy, or that dashboards are integrated. Production Cloudflare Worker and Atlas secrets are not accessible from this repository inspection. No live staging test or production cutover has been performed.
