# TUTORERA full-stack audit — 2026-09-07

## Scope and method

This audit reconciles every repository Markdown audit/specification with the current `main` branch. It checks the claims against the live source tree: Express routes/controllers/services/models, Next.js routes/components, shared API client usage, role guards, SEO files, and production builds. It does not treat a checkbox in an earlier report as proof of implementation.

Build baseline at audit time:

- Backend `npm run build`: passed.
- Frontend `npm run build`: passed; 301 routes generated.
- Frontend lint: previously passed with 0 errors and legacy warnings.
- Targeted backend booking, socket authorization, and at-risk rescue tests: 3 suites / 17 tests passed.
- The remaining legacy Jest suite still contains old controller imports and fixtures that do not satisfy current fee snapshots; those tests need a separate contract-refresh pass.

## Documentation drift found

The older `TUTORERA-STRATEGIC-AUDIT.md` and `COMPETITIVE_GAP_MATRIX.md` are stale in several places. They still mark these capabilities missing even though the current branch contains working backend models/routes and/or frontend surfaces:

| Earlier claim | Current evidence | Correct status |
| --- | --- | --- |
| Parent accounts missing | `parent.routes.ts`, `ParentProfile`, `/parents`, `ParentDashboard` | Implemented, but guardian consent/child invitation UX is still incomplete |
| Recurring bookings/packages | Removed by product decision | Out of scope: TUTORERA uses student requirements, tutor offers, negotiation, and one-off accepted bookings |
| Liquidity score missing | `/liquidity/score`, `/liquidity/overview`, `liquidityScore.service.ts` | Backend implemented; admin/tutor visualization remains partial |
| Tutoring Index missing | `/tutoring-index`, `/research/tutoring-index` | Implemented with anonymized aggregate output |
| Demand SEO missing | `/tuition-requests/[country]/[city]/[subject]`, sitemap generation | Implemented; indexing and inventory thresholds need production monitoring |
| `llms.txt` missing | `public/llms.txt` | Implemented; kept canonical domain language |
| Pricing intelligence missing | `/pricing/insights`, request UI integration | Implemented; needs sample-size/coverage telemetry |

## Changes made in this audit

1. Fixed liquidity price sampling. `Booking` does not store Request dimensions directly; the previous service applied Request filters to `Booking`, producing empty price samples. It now resolves recent Request IDs first and then queries bookings by `request`.
2. Excluded draft and cancelled requests from recent liquidity demand counts.
3. Fixed Tutoring Index `avgOfferRate`, which was incorrectly calculated from student budgets rather than actual offer amounts.
4. Preserved the offer-led booking lifecycle as the only marketplace transaction model.
5. Added `/research/tutoring-index`, privacy-safe methodology copy, Dataset JSON-LD, sitemap inclusion, footer discovery, and LLM documentation.

## Remaining true gaps

### P2 product/market intelligence

- ML reranking and booking-probability models are not implemented; matching remains deterministic/rule-based.
- Match Graph/event warehouse and experimentation/A-B testing infrastructure are absent.
- Public tutor quality score and advanced personalization are absent.
- Liquidity scoring is available through APIs but is not yet surfaced as a dedicated tutor-facing opportunity view or configurable admin segment dashboard.
- Tutoring Index is aggregate reporting, not yet a versioned research pipeline with downloadable releases, confidence intervals, or independent methodology review.

### Payments and operations

- Payout processing remains provider/configuration dependent; the worker attempts pending payouts but no external payout settlement is guaranteed without a configured provider.
- Content moderation supports rule flags and optional Cloudinary moderation, but there is no guaranteed provider-backed image/video moderation SLA.

### Trust, safety, and lifecycle

- Parent linking currently relies on a student user ID. A consented invitation/acceptance flow and child-level authorization checks are still needed.
- Re-verification flags and admin actions exist; automated expiry reminders and document-expiry enforcement need production data and scheduled policy tests.
- Off-platform contact filtering flags offers/messages, but a complete user-facing moderation appeal and risk-review queue is still needed.
- Automated lifecycle jobs run in-process. They need an external scheduler/leader-election strategy for multi-instance deployments and observable failure alerts.

### Frontend parity and UX

- Admin has separate supply-gap and control-tower views, but no dedicated UI for `/liquidity/overview` score dimensions.
- Tutor earnings expose ledger/payout status, but not a complete payout timeline with provider reference, settlement ETA, and retry reason.
- Legacy inline styles and duplicated controls remain in older dashboard/admin screens; they are quality debt, not a missing API.
- The frontend still reports a Next.js middleware deprecation warning; migrate to the proxy convention in a dedicated compatibility change.

## High-risk contracts to test before deployment

1. Tutor session completion must be idempotent and must not increment relationship counts twice.
2. Parent-created checkout must preserve the child student, parent payer, and fee snapshot across webhook retries.
3. Liquidity and Tutoring Index aggregates must never expose exact addresses, contacts, emails, or individual request narratives.
4. All role-protected routes must be tested with student, parent, tutor, admin, suspended, expired-token, and unauthenticated fixtures.
5. Cloudflare Worker production smoke tests must cover `/api/v1`, `/tutoring-index`, auth redirects, and canonical/noindex behavior for any legacy Vercel host.

## Prioritised build order

1. Continue strengthening offer, negotiation, booking, and payment integrity.
2. Add parent consent/invitation and child authorization checks.
3. Add dedicated liquidity score UI and admin filters.
4. Add payout provider settlement state machine and tutor timeline.
5. Build event warehouse/Match Graph, then ML reranking only after sufficient labelled outcomes exist.
6. Consolidate the remaining frontend design-system debt and migrate middleware when OpenNext supports the Next.js proxy runtime.

The repository is therefore not “fully complete”: the marketplace foundation and most P0/P1 surfaces are present, while the listed P2 intelligence, parent consent, provider settlement, and operational observability items remain genuine work.
