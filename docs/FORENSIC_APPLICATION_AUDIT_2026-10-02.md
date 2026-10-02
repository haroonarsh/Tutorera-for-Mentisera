# TUTORERA Forensic Full-Stack Audit — 2026-10-02

## 1. Executive Summary

**Overall health: partial, with several production-blocking integrity risks.** The repository is a substantial Next.js 16/Cloudflare frontend and Express/MongoDB backend. Its student-request → offer → payment → booking architecture, tutor application tracking, subject eligibility, agreements, administration, email logging, and market configuration all exist. Builds and targeted tests pass, but static tracing shows that several critical controls are configuration-dependent or duplicated.

This is an evidence-based code audit, not a claim that production data, Cloudflare DNS, Render environment variables, MongoDB indexes, external Switch credentials, or live payment settlement were tested. Those require a controlled staging/production audit with authorized test accounts.

## 2. Architecture Discovered

```text
Cloudflare/OpenNext frontend (tutorera-frontend)
  Next.js app routes, React client pages, Axios client, Socket.IO client
        ↓ /api/v1
Render Express backend (tutorera-backend)
  route → controller → Mongoose model/service → MongoDB
  Socket.IO, Cloudinary uploads, Resend/Nodemailer email, Switch checkout
        ↓
MongoDB collections: User, Student/Tutor/ParentProfile, Request, Bid,
OfferNegotiation, Booking, PaymentLedger, reviews, safety, audit, geography
```

Server entry point: `tutorera-backend/src/server.ts`. API composition: `tutorera-backend/src/app.ts`. The frontend contains 120+ App Router pages, while the backend mounts 29 route modules and approximately 283 HTTP handlers.

## 3. Critical P0 Findings

| ID | Finding | Evidence | Status | Required action |
|---|---|---|---|---|
| P0-01 | Switch may send production payments to sandbox endpoints if environment variables are absent or misnamed. | `src/services/swichProvider.service.ts` hard-codes `https://sandbox-auth.swichnow.com` and `https://sandbox-api.swichnow.com` as defaults. | **BROKEN / SECURITY & FINANCIAL RISK** | Make live/sandbox mode explicit, fail boot in production unless live allowlisted hosts and credentials are present, add environment validation and a non-money production smoke test. |
| P0-02 | Resend email webhook becomes unsigned when `RESEND_WEBHOOK_SECRET` is unset. | `src/controllers/emailWebhook.controller.ts:verifyResendPayload` parses raw JSON without signature verification when the secret is absent. | **SECURITY RISK** | Reject requests (503) when webhook processing is enabled but the secret is absent; validate Svix signatures always; retain an explicit disabled mode only. |
| P0-03 | Payment finalization depends on the browser returning from Switch. | `payment.controller.ts:confirmSwichPayment` is called from `frontend/src/app/offers/page.tsx`; `swichProvider.service.ts` explicitly says periodic polling is “eventually” needed. No payment-session reconciliation job is scheduled in `server.ts`. | **DATA INTEGRITY RISK** | Add an idempotent server job that reconciles pending checkout ledgers, locks finalization, alerts on stale sessions, and is tested for browser abandonment. |

## 4. P1 Findings

| ID | Finding | Evidence | Classification | Required action |
|---|---|---|---|---|
| P1-01 | Global USD settlement is incomplete; many live code paths silently default to PKR. | `paymentProvider.service.ts`, `payment.controller.ts`, `booking.controller.ts`, `request.controller.ts`, tutor frontend components, and admin exports use `|| "PKR"` or PKR labels. | **DATA INTEGRITY RISK** | Choose one authoritative currency rule, migrate only missing legacy records deliberately, remove runtime PKR defaults from global flows, and add country/currency contract tests. |
| P1-02 | Scheduled jobs run in the web process with no distributed lock, queue, retry record, or health monitor. | `server.ts` starts offer expiry, lifecycle, payout, reminders, and exchange-rate timers with `setInterval`. | **PARTIAL** | Move jobs to a singleton worker/managed scheduler or implement Mongo lease locks, durable job logs, retries, and an admin health surface. |
| P1-03 | Tutor eligibility has more than one authority and a legacy bypass. | `tracking.service.ts:isMarketplaceEligible` returns true early for persisted `marketplaceEligible`; `tutorActivation.service.ts` separately evaluates status; model pre-save derives status. | **DUPLICATE / LEGACY** | Consolidate status calculation into one domain service. Replace the legacy bypass with a versioned migration/explicit grandfather policy and audit report. |
| P1-04 | Direct booking remains a primary code path despite the stated student-led offer-only direction. | `DirectBookingModal`, `TutorProfileActions`, `/requests/direct`, direct-booking lifecycle and reminder events. | **REQUIRES DECISION** | Either document direct booking as a secondary pathway with its own safety/price rules, or retire it through the controlled removal plan. Do not leave two conflicting acquisition models. |
| P1-05 | Full end-to-end marketplace proof is absent. | Backend has focused tests and five frontend Playwright specs, but no complete authenticated requirement → offer → payment confirmation → booking → session → review suite. | **PARTIAL** | Add seeded, isolated E2E workflows and negative/race tests before calling the marketplace production-ready. |

## 5. P2/P3 Findings

- **P2 type safety:** 589 `any` / `as any` usages were found under `src`; critical payment/eligibility code uses several of them. Replace boundary casts with shared DTOs and runtime schemas first.
- **P2 frontend status contract:** before this audit the new `SUBJECT_ELIGIBILITY_REQUIRED` backend status was absent from frontend types/filters. It was corrected in commit `af21177`; future status additions need shared contract generation or API-schema tests.
- **P2 obsolete UI framework boundary:** Next.js reports the `middleware` convention as deprecated; migrate to the current `proxy` convention after verifying canonical-host behavior.
- **P2 administrative exports:** `admin.controller.ts` contains PKR-only report headings, inconsistent with global USD settlement.
- **P3 blog search/popularity:** `BlogSidebar.tsx` labels search/popularity as TODO/static; it is intentionally non-authoritative and must not be presented as analytics.

## 6. Complete Functional Matrix

| Feature | Frontend | API/Backend | DB | Tests | Actual status |
|---|---|---|---|---|---|
| Authentication | login/register/settings pages | auth routes/controllers/middleware | User | auth/OTP tests | **WORKING WITH IMPROVEMENT** |
| Tutor onboarding | multi-step onboarding/status/resubmission | tutor/tracking/verification services | TutorProfile, document history | onboarding E2E, activation tests | **WORKING WITH IMPROVEMENT** |
| Education + subject eligibility | onboarding/admin application UI | subject eligibility service and tracking | TutorProfile embedded eligibility | subject tests | **WORKING** after `af21177` |
| Student requirements | wizard/composer/request pages | request controller/lifecycle/matching | Request/history | validators/privacy tests | **PARTIAL** — no full E2E proof |
| Matching | browse opportunities/admin matching | matching service/config/logs | MatchLog/config | matching RBAC tests | **PARTIAL** |
| Offers/negotiation | comparison/counter UI | offer/request controllers | Bid/OfferNegotiation | bid/concurrency tests | **WORKING WITH IMPROVEMENT** |
| Direct booking | profile CTA/modal | `/requests/direct` | Request/Bid | direct booking test | **REQUIRES DECISION** |
| Booking | dashboards/admin | booking controller/service | Booking | booking tests | **PARTIAL** |
| Payments | offers/payment pages | Switch adapter/payment controller | PaymentLedger | provider tests | **PARTIAL / P0 risk** |
| Payouts | tutor/admin reports | payout services/controllers | PayoutReport/ledger | payout tests | **PARTIAL** |
| Notifications/email | notification and email-log UIs | events/Resend/webhook | Notification/EmailLog | reminder tests | **PARTIAL / P0 webhook risk** |
| Geography/global markets | country routes/pickers/admin | geo/market services | Country/Region/City/Locality | global-markets tests | **WORKING WITH IMPROVEMENT** |
| SEO | metadata, sitemaps, canonical middleware | public data routes | derived | no complete production crawl test | **PARTIAL** |

## 7. Frontend Audit

**Active surfaces:** public acquisition, country/city SEO routes, tutors, request posting, dashboards, tutor application/status/agreement flows, chat, payments, and a large admin console.

**Evidence-backed frontend gaps:**

1. App route coverage is broad but does not prove navigation reachability. Header/footer link crawling and authenticated browser checks are still required.
2. `StudentDashboard.tsx` uses `countering.currency || "PKR"`; `CommissionCalculator.tsx` is PKR-specific. These contradict the USD settlement decision.
3. `DirectBookingModal.tsx` is still reachable from public tutor actions. This conflicts with a strict offer-only model.
4. Frontend `CanonicalStatus` was independently declared. The subject-eligibility mismatch demonstrates the contract drift risk.
5. Existing Playwright coverage is limited to admin control tower, liquidity, login, matching, payout report, and tutor opportunities; it does not cover post-requirement, offer comparison, payment return, or mobile accessibility.

## 8. Backend Audit

**Working structure:** route modules generally apply `protect`, `authorize`, and Zod validation; services exist for pricing, matching, activation, market configuration, payment provider, and notifications.

**Backend gaps:**

1. Controllers retain meaningful domain logic (payment finalization and request state changes), making the service layer non-uniform.
2. Payment checkout has a durable `PaymentLedger`, but reconciliation is not durable/scheduled.
3. The web process schedules business jobs. Horizontal scaling will duplicate these executions unless protected outside this repository.
4. Notification email factory has placeholder auth entries in `notification.service.ts`; auth controller is separately authoritative. This is legacy/duplicate behavior that should be removed or delegated explicitly.

## 9. Database Audit

MongoDB/Mongoose models cover the expected marketplace entities: users/profiles, requests, bids/offers, negotiations, bookings, payment ledger, payouts, reviews, safety cases, audit logs, notifications, documents, agreements, geography, market/fee/tax config.

Risks requiring live inspection:

- No database migration framework is visible; migration is a set of manually run scripts (`migrateLegacyPakistan`, `normalizeTutorProfileLevels`, `migrateSwitchOnlyPayments`, etc.). Record execution, idempotency, dry-run output, and rollback state in a migration ledger.
- Mongoose cannot give relational foreign-key enforcement. Critical booking/offer/payment transitions therefore need transactions and unique indexes verified using `db.collection.getIndexes()` in production.
- Currency defaults remain PKR in models/controllers and need a staged data migration, not just UI replacement.
- No production query plans or index inventory were available; matching, admin filter, and ledger queries need `explain("executionStats")` against safe representative data.

## 10. Frontend ↔ Backend Mismatches

| Feature | Frontend assumption | Backend reality | Impact | Fix |
|---|---|---|---|---|
| Tutor application state | Local enum listed status values | Backend added `SUBJECT_ELIGIBILITY_REQUIRED` | generic/incorrect display | Fixed in `af21177`; introduce shared schema |
| Currency | several widgets show PKR | market config/payment migration targets USD | wrong labels/amount interpretation | remove PKR fallbacks in global code |
| Payment completion | browser return resolves transaction | backend has no scheduled reconciliation | paid-but-unfinalized booking possible | durable polling/worker |
| Product flow | tutor profile exposes Direct Booking | desired primary flow is offers on student requirements | two competing journeys | product decision + controlled retirement/labeling |

## 11. Dead Code

No file is classified **confirmed dead** solely from static review. Candidates needing reference tracing:

| File/symbol | Evidence | Classification | Safe to remove? |
|---|---|---|---|
| `notification.service.ts` auth placeholder templates | comments say auth logic is in auth controller | **LEGACY BUT REFERENCED / REVIEW** | No — first trace registry consumers |
| Vercel references in SEO middleware/constants | only block/redirect legacy Vercel host | **INTENTIONAL LEGACY PROTECTION** | No — retain until stale host is demonstrably deindexed and redirected |
| Direct-booking frontend/backend stack | actively imported and routed | **ACTIVE, PRODUCT-QUESTIONABLE** | No — requires decision/migration |
| static blog search/popularity | explicit TODO comments | **PARTIAL FEATURE** | No — either implement or label/remove UI |

## 12. Duplicate Implementations

| Concept | Implementations | Conflict | Authoritative target |
|---|---|---|---|
| Tutor eligibility | `tracking.service`, `tutorActivation.service`, TutorProfile pre-save, controller flags | legacy `marketplaceEligible` can override current proof | one activation domain service |
| Currency | market config/global USD work plus PKR model/controller/UI fallbacks | records and displays can diverge | market/currency resolver + immutable snapshots |
| Payment completion | checkout ledger, return-confirm endpoint, booking direct checkout | return path is not a system reconciliation path | provider adapter + reconciliation worker |
| Tutor discovery | offer marketplace plus direct booking | product proposition is ambiguous | explicit secondary pathway or removal |

## 13. Missing Functionality

1. **Durable Switch reconciliation.** Required because successful payment cannot depend on browser navigation. Acceptance: stale pending ledgers are pulled, exact amount/currency is verified, finalization is idempotent, and failures are visible to admins.
2. **Single-source API contract.** Required to prevent status/DTO drift. Acceptance: backend response schema generates/validates frontend types and a contract test fails on enum drift.
3. **Distributed job execution.** Required before scaling Render service. Acceptance: exactly one executor claims each scheduled job, retry/audit metadata persists, and health alerts are exposed.
4. **Full payment E2E and concurrency suite.** Required before financial launch. Acceptance: return/no-return, duplicate confirmation, refund, cancelled request, suspension during acceptance, and two simultaneous accepts are exercised.

## 14. Unnecessary / Legacy Functionality

- **RapidPay:** no active runtime integration was found in the sampled code; retain only migration/audit evidence until a full dependency and environment-variable scan confirms safe removal.
- **Vercel host handling:** not application functionality; retain noindex/canonical protection while historical URLs may be indexed.
- **Direct booking:** not “unnecessary” until the business owner chooses offer-only vs secondary discovery. It is currently active.

## 15. Security & Privacy

- P0-02 unsigned webhook fallback requires immediate correction.
- CORS uses a fixed allowlist in `app.ts`, which is good, but the deployed `CLIENT_URL` needs verification against the Cloudflare canonical domain.
- JSON limits, Helmet, HPP, request IDs, rate limiting, MIME tests, and signed document handling are present.
- Object-level authorization exists in sampled payment routes; a systematic IDOR test suite is still missing for requests, offers, chats, payout files, reviews, and admin country scope.
- Do not expose document URLs, precise student addresses, or payment ledger data without live authorization tests.

## 16. Marketplace Integrity

The intended chain is represented: Request → Match → Bid/Offer → Negotiation → paid acceptance → Booking → payout/review. Focused bid concurrency tests exist. It remains **PARTIAL** because direct booking runs beside the offer path and payment confirmation has no background reconciliation.

## 17. Student Journey

Requirement wizard and student/parent permissions exist. Open items: authenticated mobile E2E, real payment return/no-return, visibility checks proving address/contact redaction in every response, and rebooking/review evidence.

## 18. Tutor Journey

Tutor onboarding, document reviews, subject-level eligibility, agreement, status tracking, opportunities, offers, earnings, and payout reports exist. Commit `af21177` now blocks activation until an education credential and at least one approved subject+level are present, and sends actionable daily reminders while tutor input is missing. Remaining proof: live mail delivery and a full tutor→offer→payout test.

## 19. Admin Journey

Admin pages exist for applications, verification, markets, payments, payouts, email logs, safety, matching, fee/tax configuration, and audit logs. Evidence does not establish every screen is connected; priority browser/API tests should cover document decision, subject approval, account enforcement, request moderation, payout action, refund, and country-admin isolation.

## 20. Payments & Financial Logic

Switch adapter, ledger, fee snapshots, confirmation endpoint, admin/reconciliation screens and provider tests exist. P0 sandbox default and no-return reconciliation block production readiness. Global USD migration is incomplete because PKR defaults remain in authoritative code and presentation layers.

## 21. Notifications & Email

Email logs, Resend webhook, notification registry, reminder jobs, agreement reminders and abandonment recovery exist. The tutor reminder now continues for missing education/subject submission but does not spam a tutor while an administrator is merely reviewing. Webhook signature enforcement is the critical gap.

## 22. SEO/AEO/LLMO Technical Integrity

Canonical/noindex defense for `*.vercel.app` exists in frontend middleware/constants. Verify in production: response headers, canonical tags, sitemap hostnames, robots, redirects, and search-console removal. Never describe sitemap/index coverage as proven until crawled live.

## 23. Performance

The repository contains batching/pagination in several controllers, but no production traces, slow-query logs, or query-plan evidence was reviewed. Prioritize matching, offer list, admin application queue, ledger history, and tutor directory. The 589 unsafe casts also prevent reliable profiling assumptions.

## 24. Infrastructure & Deployment

Expected deployment is Cloudflare/OpenNext frontend and Render backend. `frontend/package.json` supports OpenNext/Cloudflare deployment; no Vercel deployment script is present. Backend recurring work runs inside Render web process, which must be redesigned before multiple instances. Validate secrets/configuration using a deployment checklist; never place secrets in source control.

## 25. Test Coverage

Backend currently has 35 focused Jest test files; frontend has five Playwright specs. This is useful regression coverage but insufficient end-to-end marketplace assurance. The latest verification build passed backend TypeScript, frontend production build, and focused subject/agreement/reminder suites; it is not a live payment test.

## 26. Target Architecture

```text
Public/SEO → Auth → Marketplace domain
                         ├─ Requirements / matching / offers / bookings
                         ├─ Payments (provider adapter + ledger + reconciler)
                         └─ Sessions / reviews
                    Trust domain
                         ├─ Verification / subject eligibility / agreements
                         ├─ safety / disputes / moderation
                         └─ notifications / audit
                    Platform domain
                         ├─ geography / market config / currency resolver
                         ├─ admin/RBAC
                         └─ scheduled worker + observability
```

## 27. Remediation Roadmap

1. **Phase 0:** block unsigned Resend webhooks; fail closed on Switch sandbox hosts in production; add payment reconciliation.
2. **Phase 1:** resolve global USD versus local-currency policy and migrate defaults/snapshots; consolidate tutor eligibility.
3. **Phase 2:** move all recurring jobs to a locked worker/scheduler; add durable job/audit metrics.
4. **Phase 3:** generate shared contracts, reduce `any` in payment/eligibility/request paths, and remove inline domain logic.
5. **Phase 4:** complete E2E journeys and negative/race tests.
6. **Phase 5:** make a product decision on direct booking, then migrate/remove safely if offer-only is final.
7. **Phase 6:** production query/index/caching review, accessibility/mobile tests, then SEO revalidation.

## 28. Removal / Consolidation Plan

Do not delete during audit. For each candidate: identify imports/dynamic loads/routes/jobs/external consumers, add regression coverage, disable behind a feature flag where appropriate, monitor, then remove in a small reversible commit. Direct booking and legacy eligibility are not safe deletion candidates yet.

## 29. Files Requiring Changes

- `tutorera-backend/src/services/swichProvider.service.ts`
- `tutorera-backend/src/config/env.ts`
- `tutorera-backend/src/controllers/emailWebhook.controller.ts`
- `tutorera-backend/src/services/paymentProvider.service.ts`
- `tutorera-backend/src/server.ts`
- `tutorera-backend/src/services/tracking.service.ts`
- `tutorera-backend/src/services/tutorActivation.service.ts`
- `tutorera-backend/src/models/TutorProfile.model.ts`
- global currency defaults in payment/request/booking/admin controllers and frontend finance components
- frontend/back-end shared tracking/API contract module

## 30. Acceptance Test Plan

1. Production-mode boot fails with sandbox Switch URL, missing Switch credentials, or missing Resend webhook secret.
2. Signed Resend event updates exactly one EmailLog; unsigned/malformed event changes none.
3. A successful Switch session finalizes once even if browser never returns; duplicate polls do not duplicate booking/ledger/notification.
4. Every enabled-market transaction uses the approved authoritative currency from request through invoice, email, ledger, payout and admin export.
5. A tutor with all documents but no approved subject-level remains non-public/non-matchable/non-offerable; after approval and agreement, activation occurs once.
6. Student online and home requirements complete through matching, offer comparison, paid acceptance, booking, session, review, and correct notifications.
7. IDOR/race tests prove no cross-user access, no double acceptance, no payment double-finalization, and no stale suspended tutor visibility.

