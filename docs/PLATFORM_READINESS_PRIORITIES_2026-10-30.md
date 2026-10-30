# TUTORERA readiness and growth priorities — 30 October 2026

This assessment compares the audit checkpoints, selected current code paths, and
the verified deployment checkpoint. It is not a new exhaustive penetration test,
production database audit, real-money test, or authenticated multi-role E2E run.
Earlier audit findings must be reconciled with later fixes before counting gaps.

## Existing foundation

### Subject catalogue and course-page checkpoint

On 30 October 2026 a read-only query of the authoritative MongoDB `subjects`
collection found 23 active subjects. This is a catalogue count, not verified
available tutor inventory. The old `/subjects` screen had a separate hard-coded
list, including names absent from this catalogue and links that did not resolve
to the corresponding canonical subject.

The local implementation adds read-only `GET /api/v1/geo/subjects` for active
subject names, slugs and categories, and `/subjects/[slug]` landing pages with
subject-specific study areas for the 23 existing topics, a student request link,
tutor discovery and an application link for tutors. Request links prefill the
subject and the request wizard checks the current list before advancing. The
page links separately to MENTISERA's online school, without representing its
class admissions or fees as TUTORERA marketplace offerings. Unknown slugs return
404; individual guides carry noindex pending per-subject inventory verification.

Until the backend endpoint is deployed, the frontend uses a clearly labelled
reference fallback of 23 subjects. The fallback uses the current canonical
`quran-arabic` slug. New/archived subjects will only be reflected automatically
when the backend endpoint is deployed. Backend build/read-only tests, frontend
production build and two browser tests passed, including HTTP checks for all 23
fallback pages, prefilled request and 320px layout. No deployment was made.

The repository already includes student requirements, competing offers,
negotiation, matching, tutor applications and document decisions, qualification
and subject-level approval, agreements, booking/payment records, administrative
screens, email outbox/logging, country configuration and public SEO routes.
The frontend is live on Cloudflare; the operational backend remains Render.
These components must be verified together rather than rewritten wholesale.

## Ranked gaps

| Priority | Finding and evidence | Completion criterion |
|---|---|---|
| P0 | Payment decision and runtime disagree: `paymentProvider.service.ts` still uses Swich; Cloudflare's payment release policy selects RapidPay and blocks release. Merchant documentation/live configuration are pending from the owner. | Verified RapidPay contract, authorized market/currency matrix, secure configuration, idempotent confirmation, abandonment/reconciliation tests and controlled payment/refund acceptance evidence. Preserve historical ledgers. |
| P0 | Source/deployment drift: frontend was published from a locally verified build; migration changes remain uncommitted. Native backend scheduler/monitoring changes are not deployed to Render or production Workers. | Reviewed Git commit, reproducible artifact, recorded frontend/backend version pair, environment inventory, rollback procedure and authenticated smoke evidence. |
| P0 | Complete real-provider marketplace proof is still absent. Existing backend tests and frontend specs do not establish the entire live student/parent/tutor/admin journey. | Isolated browser/API flows for document rejection/resubmission, subject approval, agreement, request, competing offers, acceptance race, payment, lesson, refund/dispute and payout. Include mobile and authorization-negative cases. |
| P1 | Automated settlement is disabled: `payout.service.ts` scans and warns that no verified payout-provider adapter exists; it does not transfer money. Its threshold of 500 is not currency-qualified. | Explicit manual operations workflow or verified provider adapter; currency-aware eligibility/thresholds, unique transfer references, reconciliation, retry safety and evidence of receipt. Never mark a payout paid just because a report exists. |
| P1 | Deployment automation can mask failures: frontend workflow skips credential-dependent deployment and ends its health timeout with an echo; backend deploy request lacks curl HTTP-failure enforcement and checks a not-yet-cut-over API hostname. | Missing credentials fail the release; deployment API errors fail CI; smoke checks use the actual target and deployed version; use locked dependency installs and one reproducible OpenNext build. |
| P1 | Durable queue monitoring is implemented locally, but audited replay controls remain absent. Renewal cannot cancel external effects after lease loss. | Restricted, reason-required, audited replay with duplicate/replay tests, alerting on held jobs, tested ownership handover and idempotent external effects. |
| P1 | Academic audit's latest checkpoint still calls out broader controller transaction coverage and authenticated retry integration tests. Many earlier qualification gaps have already been fixed. | Prove every alternate profile/upload/review writer preserves qualification links and commits status, audit and notification intent atomically; rerun production-safe fixtures. |
| P1 | Backup restoration, production indexes/query plans, data reconciliation and recovery objectives have not been verified in this assessment. | Demonstrated restore in isolation, documented recovery targets, index inventory, dry-run migration ledger and representative query-plan checks. Do not infer production indexes from schema declarations. |
| P1 | Native architecture concentrates API traffic in `api-primary`, with Mongo maxPoolSize 1. Its capacity has not been established. | Load-test realistic auth, search, uploads, chat and jobs; measure concurrency, latency, quota and failure behavior before cutover. Retain Free-only limits unless the owner changes the budget. |
| P2 | UI coverage is broad, but production accessibility and full multi-role interaction coverage are not demonstrated by successful HTTP page responses. | Keyboard/focus, screen-reader errors, 320–430px layouts, contrast, upload recovery and truthful status synchronization verified on critical flows. |
| P2 | Market pages/configuration do not prove operational readiness in each country. | Explicit discovery/transactional labels, verified eligible inventory, timezone/DST behavior, supported charging/settlement currency and appropriate verification/operations per enabled market. |
| P2 | Search and growth outcomes remain unverified. Metadata, numerous pages, and llms.txt do not prove demand or rankings. | Search Console/Bing indexing review, field performance data, inventory-backed landing pages, reviewed original educational content, real reviews/partnerships and measured request-to-booking conversion. |

## Operating metrics needed to judge leadership

Track by country, city, subject, level and teaching mode: qualified offers per
request, time to first qualified offer, no-offer rate, acceptance/paid-booking
conversion, first-lesson completion, repeat booking, cancellation/refund/dispute
rates, response time, review quality and payout timeliness. Existing analytics
features should be assessed for accuracy and coverage; their absence is not
asserted without tracing them. Set numerical targets after a reliable baseline.

Start with dense, well-served market segments. Adding countries, thousands of
landing pages or ML ranking before sufficient verified supply and real conversion
data is not evidence of a better marketplace.

## Recommended execution order

### Marketplace lifecycle follow-up

The student offer acceptance path now checks current subject/level approval
before reserving parent approval or payment. Offer renewal no longer reopens
accepted, rejected, withdrawn or not-selected offers merely because their former
expiry timestamp passed. Expired-offer renewal now checks the active request,
market offer feature, tutor activation, home safety and current subject approval;
it atomically updates the offer and negotiation history, and competes with
request state changes. Local regression tests cover ownership, terminal states,
revocation and simultaneous renewal/acceptance. This does not replace a complete
multi-role browser/provider E2E. These backend changes are not deployed.

Further offer-state remediation: decline/withdraw now require a live request and
unexpired active offer, and atomically update the request lock, offer and active
negotiation history. Acceptance now reserves the request and the unchanged offer
in one transaction, including parent-approval reservations. View transitions
use a conditional update, preventing stale saves from overwriting newer states.
Targeted suites passed 22 offer/authorization/concurrency tests, then 26 tests
covering renewal, parent authorization and the existing lifecycle fixture. Checkout
provider calls in these tests are mocked. Late checkout failure versus a newer
payment reservation and the full browser/provider journey still require testing.

Checkout reservation follow-up: the offer acceptance flow assigns an additive
unique reservation ID. Failed checkout cleanup now releases only its own hold,
and request/offer cleanup is transactional. Expiry cleanup identifies the selected
offer, checks the current deadline and safely handles a single legacy reservation
without an `acceptedOffer`; ambiguous legacy data remains untouched. Retry checks
the request and deadline and rotates the offer reservation ID. A late checkout
response is not returned to the browser after a newer hold supersedes it. The
backend build and 28 targeted fixture tests passed, including late failure, late
response, selected-versus-stale holds and acceptance races. No provider or live
payments were used; these changes are not deployed.

Financial boundary found before the checkout-guard follow-up: the Swich adapter
reuses a basket and overlapping checkout requests could overwrite its ledger
session. Reservation protection alone cannot prove external sessions were
cancelled or prevent duplicate charges.

Checkout guard follow-up: the local adapter now uses a Mongo `_id`-unique guard
to serialize creation per basket, including when automatic index creation is
disabled. It refuses replacement sessions unless a prior session is confirmed
failed, expired or cancelled; a successful prior payment blocks creation. A
provider call with an ambiguous outcome persists an `uncertain` guard and prevents
automatic retry or expiry release. An unresolved ledger also prevents releasing
the student's hold. Successfully replaced sessions reset the checkout ledger to
pending for reconciliation. Backend build, 23 payment/reconciliation tests and
33 guard/offer concurrency tests passed with mocked provider calls. This is not
proof of provider behavior or exactly-once charging. The guard can remain stuck
after a process crash or timeout; authorized admin inspection/reconciliation and
safe recovery are still required before deployment. RapidPay contract, provider
capabilities and real payment/refund verification remain pending.

Legacy direct-accept follow-up: both acceptance endpoints share the same atomic
offer reservation and reservation-specific failure release. Tutor acceptance of a
direct request now reserves the offer and notifies the student to pay, instead of
creating a checkout for the tutor. Parent approval also uses the shared guard.
Student checkout requires actual payer contact and identity inputs, with no dummy
phone fallback; late stale checkout URLs are withheld. Tutor UI displays the
returned next-step message. Four targeted backend suites passed 27 tests; backend
build and frontend type checking passed. Payment calls were mocked and no live
payment was performed. Source changes remain undeployed.

Parent approval follow-up: invalid or missing decisions now return 400 rather
than implicitly approving. Linked parents can approve or decline once; approval
rechecks subject authorization and the selected, unexpired rate, atomically
reserves it for student payment, and notifies the student. It does not initiate
checkout or invent a payer phone. A pending promo code is carried to the student
checkout retry and revalidated. Local tests cover invalid decisions, unrelated
parents, concurrent approve/decline, revoked subject eligibility and the student
payment handoff, with the gateway mocked. Backend build passed; 26 focused tests
passed. Existing controls still require production-like E2E and operational
notification delivery checks. These changes are not deployed.

1. Reconcile source, deployed versions and CI; rotate credentials exposed earlier
   and verify least-privilege configuration without copying values into documents.
2. Complete RapidPay when merchant documentation/configuration arrive. Until then,
   continue independent testing and operations work without bypassing release gates.
3. Prove full student/parent/tutor/admin journeys, eligibility and financial safety.
4. Finish payout operations, audited queue recovery, alerts and restore testing.
5. Establish liquidity/retention baselines, improve mobile completion and support.
6. Expand evidence-backed acquisition and markets only where operations work.

No code, SEO configuration or AI-search tactic guarantees first-place rankings.
Google's own SEO Starter Guide explicitly states that no secret automatically
ranks a site first. Cloudflare Free limits must also be capacity-tested, rather
than treated as unlimited hosting.

References:
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.cloudflare.com/workers/platform/limits/
