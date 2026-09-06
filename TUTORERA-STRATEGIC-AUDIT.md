# TUTORERA — Complete Strategic Audit, Competitive Gap Matrix & Implementation Roadmap

**Date:** 2026-09-06  
**Scope:** Full-stack codebase audit (`tutorera-backend` + `tutorera-frontend`)  
**Strategic brief:** "TUTORERA MUST WIN — The Student-Led Tutoring Marketplace"

---

## PART 1 — EXECUTIVE SUMMARY

TUTORERA's backend is **unexpectedly sophisticated**. Beneath the tracking-system commit lies a 30-model, 26-controller marketplace with:

- An 8-layer smart matching engine with Bayesian ratings, currency normalization, timezone-aware scheduling, cold-start exploration, and progressive tiered notification dispatch
- A complete offer lifecycle: request → bid → counter-offer (max 3 per party) → accept → payment hold → webhook → atomic booking creation
- An admin control tower with at-risk request rescue, supply-gap intelligence, financial reconciliation, system health monitoring, and 11-role RBAC
- Per-component tutor verification with canonical status computation, sha256-hashed tracking tokens, and 16 branded email templates
- Email webhook ingestion (Resend/Svix), email logging, abandoned-journey recovery, and a 15-minute cron lifecycle worker
- Multi-country market configuration (PK, SA, AE, GB), multi-currency support, and geospatial city/subject/level SEO architecture

**The backend is not the problem.** The gaps are:

1. **Frontend design system debt** — 30+ duplicated button styles, 10+ duplicated card styles, 7 unused shadcn/ui components, no centralized CSS tokens, arbitrary inline styles everywhere
2. **Frontend RBAC is cosmetic** — AdminGuard checks `role === "admin"` but never enforces granular permissions
3. **Dashboard verification gate has an error bypass** — defaults to `approved` on API failure
4. **Missing Google OAuth `/select-role` page** — Google sign-ups who need to pick a role hit a 404
5. **Tracking emails lack branding** — `trackingEmails.ts` returns raw HTML without the `renderTransactionalEmail` wrapper
6. **Matching scoring duplication** — `utils/marketplaceRules.ts` has a simpler, inconsistent scorer used only by offer listing pages
7. **No parent/guardian accounts, no recurring bookings, no packages/subscriptions** — retention mechanics are missing
8. **No `llms.txt`** — LLMO/LLM optimization is absent
9. **Accessibility gaps** — 4 modals missing focus traps, clickable divs without keyboard support, fixed-width overflow risks
10. **Payment edge cases** — stale `awaiting_payment` if webhook never arrives, no failed-payment notification, no receipt email

---

## PART 2 — CAPABILITY CLASSIFICATION

### 2.1 COMPLETE

| Capability | Evidence |
|---|---|
| Student requirement posting (open marketplace) | `request.controller.ts:createRequest`, `Request.model.ts` |
| Tutor search with filters | `getAllRequests`, `TutorsExplorer.tsx`, `FilterSidebar.tsx` |
| Smart matching engine (8-layer, Bayesian, configurable) | `matching.service.ts` (770 lines), `matching.controller.ts`, `MatchingConfig.model.ts` |
| Tutor offers on requests | `placeBid` in `request.controller.ts`, `Bid.model.ts` |
| Counter-offers (max 3 per party) | `counterOffer` in `offer.controller.ts`, `OfferNegotiation.model.ts` |
| Student counter-offers | Same endpoint, role-detection logic |
| Offer comparison UI | `OfferComparisonDemo.tsx`, `getRequestOffers` ranking with `matchScore`, `rankScore` |
| Secure payment flow (pay-before-accept) | `initiateAcceptBid` → Rapid Gateway → webhook → `finalizeBidAcceptance` (MongoDB transaction) |
| Booking lifecycle (upcoming/ongoing/completed/cancelled) | `Booking.model.ts`, `booking.controller.ts`, `admin.controller.ts` |
| Tutor verification (per-component) | `tracking.controller.ts`, `TutorProfile.model.ts` (8 per-component fields) |
| Identity verification (CNIC) | `updateCnic` endpoint, Cloudinary signed URLs for admin viewing |
| Education verification | `updateDegree` endpoint |
| Demo video verification | `updateDemoVideo` endpoint |
| Police/background verification | `updatePolice` endpoint, `policeIsRequired` gate |
| Home tuition eligibility enforcement | `isHomeTuitionEligible`, `policeVerificationStatus` checks in `placeBid` and `getEligibleTutors` |
| Marketplace eligibility auto-promotion | `syncMarketplaceAndHomeTuition` in `tracking.controller.ts` |
| In-app notifications (socket) | `socket.ts`, `sendNotification` used across 12 controllers |
| Email notifications (Resend) | `sendEmail.ts`, 16+ templates in `emailTemplates.ts` + `trackingEmails.ts` |
| Email webhook tracking | `emailWebhook.controller.ts`, `EmailLog.model.ts` |
| Audit logging | `logAudit.ts`, `AuditLog.model.ts`, used in 20+ controllers |
| Admin control tower | `adminControlTower.controller.ts` — pulse, urgent actions, at-risk preview |
| At-risk request rescue | `atRiskRequest.service.ts` — zero-offer rescue, extend, suggest_online, escalate |
| Supply-gap intelligence | `getSupplyGapsIntelligence` in admin control tower |
| Financial reconciliation | `getFinanceReconciliation` — GMV, platform gross, gateway fees, net settlement |
| Fee configuration (dynamic, versioned) | `FeeConfig.model.ts`, `updateFeeConfig`, admin fee simulator |
| Market configuration (multi-country) | `MarketConfig.model.ts`, 4 seeded markets (PK, SA, AE, GB) |
| RBAC (11 roles, 70+ permissions) | `config/rbac.ts`, `rbac.middleware.ts`, admin roles page |
| Request expiry lifecycle (7 days + extensions) | `requestLifecycle.service.ts`, 24h warnings, day-5 escalation, archival |
| Request repost | `repostRequest` in `request.controller.ts` |
| Abandoned journey recovery | `AbandonedJourney.model.ts`, `abandonedJourneyRecovery.ts` |
| Tutor earnings tracking | `earnings.controller.ts` — stats, monthly breakdown, PDF export |
| Guarantee/claim system | `GuaranteeClaim.model.ts`, `guaranteeClaim.controller.ts` |
| Trust & safety case management | `SafetyCase.model.ts`, `adminControlTower.controller.ts` |
| Chat/messaging | `chat.controller.ts`, `Conversation.model.ts`, `Message.model.ts` |
| Referral program | `referral.controller.ts`, `Referral.model.ts` |
| AI chat assistant (Groq LLaMA) | `ai.controller.ts` |
| Geo/country/city/subject/level API | `geo.controller.ts`, `config/countries.ts` |
| Rate limiting (12+ limiters) | `rateLimiters.ts` |
| File upload with signature verification | `upload.middleware.ts`, `uploadToCloudinary.ts` |
| Content filter (contact info detection) | `contentFilter.ts` |
| Browser push notifications | `SocketContext.tsx` |
| Public tutor directory with SEO | `/tutors`, `/tutors/city/`, `/tutors/subject/`, `/tutors/level/`, `SeoTutorDirectory.tsx` |
| Tutor profile pages with structured data | `ProfilePage` + `Person` schema, `BreadcrumbList` |
| Live demand feed on homepage | `TopRequestsSection.tsx`, `getPublicRequestsPreview` |
| Offer comparison demo | `OfferComparisonDemo.tsx` |
| Mobile bottom nav + sticky CTAs | `MobileBottomNav.tsx`, `StickyPostRequestCTA.tsx` |
| PWA manifest | `manifest.ts` |
| robots.txt + sitemap.xml | `robots.ts`, `sitemap.ts` |
| Blog/editorial system | `blog/page.tsx`, `blog/[slug]/page.tsx`, `editorial-content` lib |
| Legal/policy pages | 15+ pages (terms, privacy, refund, safety, etc.) |
| Admin 360° student/tutor profiles | `getStudent360`, `getTutor360` in admin control tower |
| System health monitoring | `getSystemHealth` — API, DB, memory, uptime, job status |

### 2.2 PARTIAL

| Capability | Gap |
|---|---|
| Request → Smart Match → Tutor Offers → Compare → Negotiate → Choose | Matching engine is strong, but offer comparison UI is a static demo (`OfferComparisonDemo.tsx`), not the actual comparison tool used during negotiation |
| Transparent negotiation | Counter-offers work (max 3 per party), but the UI is a bottom sheet (`CounterOfferSheet.tsx`), not a full negotiation workspace with side-by-side comparison |
| Visible student demand | `TopRequestsSection` shows 12 sanitized requests; `/tuition-requests` page exists but is basic. No city/subject demand SEO pages |
| Trust before transaction | Verification is comprehensive, but the homepage trust section is static content, not live verification statistics |
| Local SEO | City/subject/level pages exist, but no `/pk/tutors/lahore/mathematics` combined pages in the sitemap (only in `localResults` if tutors exist) |
| Global online matching | `MatchingService.getEligibleTutors` supports worldwide for online mode, but the frontend `QuickRequestComposer` defaults to `Lahore` and requires manual country change |
| Bayseian ratings | Implemented in `matching.service.ts`, but not exposed on tutor cards or profile pages in the frontend |
| Email deliverability tracking | `EmailLog` model + Resend webhook exist, but admin email logs page shows basic status only — no delivery rate trends, bounce analysis, or per-template metrics |
| Notification preferences | Frontend has a decorative preferences UI (`notifications/page.tsx`) but preferences are never persisted or enforced server-side |
| Rebooking/retention | `Book Again` CTA exists in dashboard, but no recurring lesson scheduling, no packages, no subscription model |
| Pricing intelligence | No "similar tutors in your area charge X-Y" guidance anywhere |
| LLMO/LLM optimization | No `llms.txt`, no machine-readable platform description in standardized format |
| WCAG 2.2 AA | Partial — focus traps in some modals, but missing in 4 modals, no skip link styles confirmed, touch targets below 44px in 3 places |

### 2.3 BROKEN

| Capability | Issue |
|---|---|
| Admin RBAC enforcement | `AdminGuard` checks only `role === "admin"`. All admins have super-admin access regardless of assigned role/permissions |
| Dashboard verification gate | `dashboard/page.tsx` defaults to `verificationStatus = "approved"` on API error, bypassing the pending/rejected gate |
| Google OAuth role selection | `/select-role` page referenced in auth flow but does not exist — Google users who need to pick a role get a 404 |
| Tracking email branding | `trackingEmails.ts` returns raw HTML without `renderTransactionalEmail` wrapper — no TUTORERA brand header/footer/security notice |
| Stale payment holds | `releaseExpiredPaymentHold` is only called at start of new accept attempt, not by a background job. If webhook never arrives, request stays `awaiting_payment` indefinitely |
| Failed payment notification | `transaction.failed` webhook events for BID- checkouts are silently ignored — student receives no email or notification |
| Payment receipt | No branded receipt email after successful payment |
| `marketplaceRules.ts` scorer | Simpler, inconsistent scoring (binary boolean inputs, hardcoded weights) used only by offer listing pages — diverges from the sophisticated `matching.service.ts` |
| Tutor profile page JSX | `tutors/[id]/page.tsx` has a missing closing tag (`</div>` without matching open) on line 471 — may cause hydration mismatches |
| Sitemap performance | Fetches 500 tutors + dozens of city×subject API calls on every generation — will timeout on cold starts |

### 2.4 DUPLICATED

| Asset | Locations | Notes |
|---|---|---|
| Button styles | 30+ inline implementations across all components | `ui/button.tsx` (shadcn) exists but is never imported |
| Card styles | 10+ inline implementations | No shared `Card` component |
| Avatar rendering | `Common/AvatarImage.tsx` + dozens of inline `<div>` avatars | |
| Modal/dialog patterns | 10 distinct implementations | Only some use `useFocusTrap` |
| Match score display | `MatchScoreBadge.tsx` + inline badges in `OfferComparisonDemo.tsx` | |
| Time-ago utility | `timeAgo` in 4 files (`site.ts`, `TutorDashboard.tsx`, `StudentDashboard.tsx`, `TopRequestsSection.tsx`) | `site.ts` version is canonical |
| Fee calculation | `calculateMarketplaceFees` in `constants.ts` + local calculations in `adminControlTower.controller.ts` and `payouts/page.tsx` | |

### 2.5 OUTDATED

| Asset | Issue |
|---|---|
| `trackingEmails.ts` | Raw HTML, no branded wrapper — inconsistent with `emailTemplates.ts` and `recoveryEmailTemplates.ts` |
| `TutorProfile.model.ts` rollup fields | `verificationStatus`, `isVerified`, `rejectionReason` are preserved for backwards compatibility but the per-component system is canonical. Direct mutation of rollup fields can diverge from computed state |
| `verifyTutor` endpoint | Legacy `PATCH /admin/verify/:id` still mounted and used by `/admin/verifications`. Previously diverged from tracking system — now rewritten to delegate, but the endpoint itself is legacy |
| AI system prompt | References `tutorera.mentisera.pk` (old domain), lists only Pakistan cities, hardcodes IBAN — needs update for global expansion |

### 2.6 MISSING

| Capability | Required By | Notes |
|---|---|---|
| `/select-role` page | Google OAuth flow | Google users who need to pick student/tutor role hit 404 |
| `llms.txt` | PART 45 — LLMO | No machine-readable platform description for AI/LLM consumption |
| Parent/guardian accounts | PART 40 | No parent model, no child profile linking, no parent dashboard |
| Recurring bookings / packages | PART 19, 21 | No `StudentTutorRelationship`, no package/subscription model, no recurring schedule |
| Review request automation | PART 57 | Reviews are manually submitted — no post-session review request email or in-app prompt |
| Tutor payout notifications | PART 60 | No email/socket notification when tutor payout is processed |
| Failed payment notification/email | PART 60 | Webhook silently ignores `transaction.failed` |
| Payment receipt email | PART 60 | No branded receipt after successful payment |
| Class reminders | PART 60 | No 24h/1h reminder emails or notifications |
| Off-platform circumvention detection | PART 72 | `antiCircumvention.ts` exists but is never called |
| Virus/malware scanning on uploads | PART 15 | Only MIME signature verification — no content safety |
| Content moderation on images/videos | PART 15 | No nudity/violence detection |
| Image dimension validation | PART 15 | No validation that uploaded images meet minimum dimensions |
| Tutor quality score (public) | PART 53 | Internal scoring exists but is not exposed as a visible metric |
| New tutor fairness (exploration) | PART 54 | Cold-start exploration exists in matching engine but is not surfaced in UI |
| Match score on tutor cards | PART 7 | `calculateMatchScore` exists but is not shown on tutor directory cards |
| Pricing intelligence | PART 92 | No "similar tutors charge X-Y" guidance |
| Student 360° admin view | PART 35 | `getStudent360` exists but is not wired to a frontend page |
| Tutor 360° admin view | PART 36 | `getTutor360` exists but is not wired to a frontend page |
| Marketplace liquidity score | PART 28 | Supply-gap intelligence exists but no 0-100 liquidity score |
| Demand SEO pages | PART 13, 14 | `/tuition-requests` exists but no `/tuition-requests/pk/lahore/mathematics` style pages |
| Natural language request creation | PART 6 | No AI-powered request parsing from free text |
| Bulk admin actions | PART 37 | No bulk select/update/delete in any admin table |
| Error boundaries | PART 47 | No React error boundaries in any page |
| `lastmod` in sitemap | PART 43 | All sitemap entries use `new Date()` |
| Blog `generateMetadata` | SEO | `blog/[slug]/page.tsx` lacks dynamic metadata export |
| `llms.txt` | PART 45 | Missing |

### 2.7 UNUSED

| Asset | Location | Notes |
|---|---|---|
| `ui/slider.tsx` | `src/components/ui/` | Never imported |
| `ui/select.tsx` | `src/components/ui/` | Never imported |
| `ui/label.tsx` | `src/components/ui/` | Never imported |
| `ui/input.tsx` | `src/components/ui/` | Never imported |
| `ui/button.tsx` | `src/components/ui/` | Never imported |
| `ui/badge.tsx` | `src/components/ui/` | Never imported |
| `marketplace/OfferComparisonModal.tsx` | `src/components/marketplace/` | Exported but never imported |
| `publicTrackingPathFor` | `tracking.service.ts` | Dead export |
| `publicTrackingUrl` | `tracking.service.ts` | Dead export |
| `tutorDisplayName` | `tracking.service.ts` | Dead export |
| `PUBLIC_BASE_URL` | `tracking.service.ts` | Dead constant |
| `tutorPendingEmail` re-export | `tracking.controller.ts` | Removed in last commit |
| `antiCircumvention.ts` | `src/utils/` | Defined but never imported anywhere |
| `recoveryEmailTemplates.ts` (partial) | `src/utils/` | `tutorApplicationAbandonedEmail` and `studentRequestAbandonedEmail` are unused; only `studentPaymentAbandonedEmail` is used |

---

## PART 3 — COMPETITIVE GAP MATRIX

| Capability | TUTORERA | Mera Ustad | IlmGhar | TeacherOn | UrbanPro | Preply | Required TUTORERA Improvement |
|---|---|---|---|---|---|---|---|
| **Student requirement posting** | ✅ COMPLETE | ✅ | ✅ | ✅ | ✅ | N/A | Keep current. Add NLP parsing (P1). |
| **Tutor search/directory** | ✅ COMPLETE | ✅ | ✅ | ✅ | ✅ | ✅ | Add match score on cards (P0). Add pricing intelligence (P1). |
| **Smart matching** | ✅ COMPLETE (8-layer, Bayesian) | ❌ | ❌ | ❌ | ❌ | ❌ | **Defensive moat.** Expose score in UI (P0). Add ML reranking (P2). |
| **Tutor verification** | ✅ COMPLETE (per-component) | ✅ | ✅ | ❌ | ❌ | ✅ | **Equal or better.** Add content moderation on uploads (P1). |
| **Identity verification** | ✅ COMPLETE (CNIC + hash) | ✅ | ✅ | ❌ | ❌ | ✅ | Keep. Add liveness check (P2). |
| **Education verification** | ✅ COMPLETE | ❌ | ✅ | ❌ | ❌ | ✅ | Keep. |
| **Background verification** | ✅ COMPLETE (police cert) | ✅ | ✅ | ❌ | ❌ | ❌ | Keep. Add recurring re-verification (P1). |
| **Home tuition safety** | ✅ COMPLETE (police + jurisdiction) | ✅ | ✅ | ❌ | ❌ | ❌ | Add parent/guardian controls (P1). |
| **Tutor offers** | ✅ COMPLETE | N/A | N/A | ✅ | ✅ | N/A | Keep. Add offer quality scoring (P1). |
| **Counter-offers** | ✅ COMPLETE (max 3/party) | ❌ | ❌ | ❌ | ❌ | ❌ | **Differentiator.** Improve negotiation UI (P0). |
| **Student counter-offers** | ✅ COMPLETE | ❌ | ❌ | ❌ | ❌ | ❌ | **Differentiator.** |
| **Offer comparison** | ⚠️ PARTIAL (demo only) | ❌ | ❌ | ✅ | ✅ | N/A | **P0: Build real comparison workspace.** |
| **Tutor reviews** | ✅ COMPLETE (verified booking) | ✅ | ✅ | ✅ | ✅ | ✅ | Add post-session review request automation (P1). |
| **Response time tracking** | ✅ COMPLETE | ❌ | ❌ | ✅ | ✅ | ✅ | Expose in tutor cards (P0). |
| **Availability management** | ✅ COMPLETE | ✅ | ✅ | ✅ | ✅ | ✅ | Add recurring schedule templates (P1). |
| **Pricing transparency** | ⚠️ PARTIAL | ✅ | ✅ | ❌ | ❌ | ✅ | Add pricing intelligence (P1). |
| **Payments (gateway)** | ✅ COMPLETE (Rapid Gateway) | ✅ | ✅ | ✅ | ✅ | ✅ | Add receipt email (P0). Fix stale holds (P0). |
| **Refunds** | ⚠️ PARTIAL (guarantee claims) | ✅ | ✅ | ✅ | ✅ | ✅ | Add formal refund flow (P1). |
| **Disputes** | ✅ COMPLETE (guarantee claims + safety) | ✅ | ✅ | ✅ | ✅ | ✅ | Keep. Add mediation workflow (P1). |
| **Lesson records** | ✅ COMPLETE (Booking model) | ✅ | ✅ | ✅ | ✅ | ✅ | Add session notes (P1). |
| **Rebooking** | ⚠️ PARTIAL (CTA only) | ✅ | ✅ | ✅ | ✅ | ✅ | **P1: One-click rebooking with recurring options.** |
| **Recurring lessons** | ❌ MISSING | ❌ | ❌ | ❌ | ❌ | ✅ | **P1: Packages, subscriptions, recurring schedules.** |
| **Subscriptions/packages** | ❌ MISSING | ❌ | ❌ | ❌ | ❌ | ✅ | **P1: 4-session, 8-session, monthly packages.** |
| **Tutor earnings dashboard** | ✅ COMPLETE + PDF | ✅ | ✅ | ✅ | ✅ | ✅ | Add payout status timeline (P0). |
| **Tutor payouts** | ⚠️ PARTIAL (NayaPay manual) | ✅ | ✅ | ✅ | ✅ | ✅ | Automate payout processing (P1). |
| **Student demand visibility** | ⚠️ PARTIAL (12-card feed) | ✅ | ✅ | ✅ | ✅ | N/A | **P0: Full `/tuition-requests` with filters + SEO.** |
| **Local SEO (city/subject)** | ✅ COMPLETE (70+ pages) | ✅ | ❌ | ✅ | ✅ | ❌ | Add combined city×subject×curriculum pages (P1). |
| **Global SEO** | ⚠️ PARTIAL (country hubs) | ❌ | ❌ | ✅ | ✅ | ✅ | Add country×subject pages, `llms.txt` (P1). |
| **Mobile UX** | ⚠️ PARTIAL (bottom nav + sticky CTAs) | ✅ | ✅ | ✅ | ✅ | ✅ | **P0: Fix overflow, touch targets, responsive layouts.** |
| **Parent UX** | ❌ MISSING | ✅ | ✅ | ✅ | ✅ | N/A | **P1: Parent accounts with child profiles.** |
| **Marketplace operations** | ✅ COMPLETE (control tower) | ❌ | ❌ | ❌ | ❌ | ❌ | **Defensive moat.** Add bulk actions (P1). |
| **Trust & safety** | ✅ COMPLETE (12 categories, P0-P3) | ✅ | ✅ | ✅ | ✅ | ✅ | Add content moderation (P1). |
| **No lead fees** | ✅ COMPLETE | ❌ | ✅ | ❌ | ❌ | ❌ | **Differentiator.** Keep and amplify. |
| **No bidding credits** | ✅ COMPLETE | ❌ | ❌ | ❌ | ❌ | ❌ | **Differentiator.** |
| **Transparent negotiation** | ✅ COMPLETE | ❌ | ❌ | ❌ | ❌ | ❌ | **Differentiator.** |
| **Student-led matching** | ✅ COMPLETE | ✅ | ✅ | ✅ | ✅ | N/A | **Core positioning.** Keep and amplify. |

---

## PART 4 — COMPETITIVE POSITIONING

### Where TUTORERA Already Wins

| Advantage | Evidence |
|---|---|
| Smart matching | 8-layer scorer with Bayesian ratings, currency normalization, timezone awareness, cold-start exploration — no competitor has this depth |
| Structured negotiation | Max 3 counter-offers per party, atomic state transitions, full audit trail — TeacherOn and UrbanPro leave terms to post-connection chat |
| No lead fees / bidding credits | Tutor bidding is free within plan limits — UrbanPro monetizes via coins/credits |
| Per-component verification | CNIC, degree, demo video, police — tracked individually with canonical status — Mera Ustad and IlmGhar do binary approve/reject |
| Admin control tower | Operational pulse, at-risk rescue, supply-gap intelligence, reconciliation — no competitor has this operational depth |
| Payment lifecycle | Atomic booking creation in MongoDB transaction, payment hold with expiry, idempotent webhook handling |
| Multi-country configuration | PK, SA, AE, GB with per-market fees, taxes, currencies, cities |
| Email webhook tracking | Resend webhook ingestion with Svix signature verification, `EmailLog` model with status tracking |

### Where TUTORERA Must Improve

| Weakness | Competitor Strength | Fix |
|---|---|---|
| Design system debt | Preply, UrbanPro have polished, consistent UX | P0: Unified CSS token system, shared Card/Button/Badge components |
| Frontend RBAC | IlmGhar has role-enforced admin screens | P0: Enforce RBAC in AdminGuard + per-page |
| Dashboard gate bypass | Mera Ustad has strict verification gates | P0: Remove error-state bypass |
| No parent accounts | Mera Ustad, IlmGhar support parent-managed child profiles | P1: Parent model, child profiles, parent dashboard |
| No recurring bookings | Preply has 28-day recurring cycles | P1: StudentTutorRelationship, packages, recurring schedules |
| No pricing intelligence | UrbanPro shows market rate ranges | P1: "Similar tutors charge X-Y" guidance |
| No demand SEO pages | TeacherOn has city×subject×level pages | P1: Generate demand SEO with real anonymized data |
| No `llms.txt` | Modern platforms optimize for LLM discovery | P1: Add `llms.txt` with canonical platform description |
| Tracking emails unbranded | IlmGhar has consistent transactional branding | P0: Wrap `trackingEmails.ts` in `renderTransactionalEmail` |
| Payment edge cases | Preply has robust retry/receipt flow | P0: Receipt email, failed-payment notification, stale-hold cleanup job |

---

## PART 5 — IMPLEMENTATION ROADMAP

### P0 — FOUNDATIONAL (Ship in 1-2 sprints)

**Goal:** Fix correctness, security, and UX blockers. No feature expansion.

| # | Task | Files | Validation |
|---|---|---|---|
| P0-1 | Enforce RBAC in AdminGuard | `adminGuard.tsx`, `rbac.middleware.ts` | Non-super_admin cannot access finance/safety pages |
| P0-2 | Fix dashboard verification gate | `dashboard/page.tsx` | Show loading/error on API failure, never default to `approved` |
| P0-3 | Create `/select-role` page | `app/select-role/page.tsx` | Google OAuth users can pick student/tutor role |
| P0-4 | Wrap tracking emails in branded shell | `trackingEmails.ts` | All 16 tracking emails include TUTORERA header/footer/security notice |
| P0-5 | Add payment receipt email | `emailTemplates.ts`, `payment.controller.ts` | Student receives receipt after successful payment |
| P0-6 | Add failed-payment notification | `payment.controller.ts`, `emailTemplates.ts` | Student receives email + notification on `transaction.failed` |
| P0-7 | Background job for stale payment holds | `requestLifecycle.service.ts` | Requests stuck in `awaiting_payment` > 30min are reverted |
| P0-8 | Fix TutorProfile JSX | `tutors/[id]/page.tsx` | No hydration mismatch warnings |
| P0-9 | Fix Tailwind in admin/matching | `admin/matching/page.tsx` | Remove Tailwind classes or confirm Tailwind config |
| P0-10 | Add match score to tutor cards | `TutorCard.tsx`, `TutorsExplorer.tsx` | Each tutor card shows `XX% Match` badge |
| P0-11 | Remove unused shadcn/ui components | Delete `ui/slider.tsx`, `ui/select.tsx`, `ui/label.tsx`, `ui/input.tsx`, `ui/button.tsx`, `ui/badge.tsx` | Bundle size reduction, no import errors |
| P0-12 | Remove dead exports from tracking service | `tracking.service.ts` | `publicTrackingPathFor`, `publicTrackingUrl`, `tutorDisplayName`, `PUBLIC_BASE_URL` removed |
| P0-13 | Add focus traps to 4 missing modals | `MatchedTutorsModal.tsx`, `OfferComparisonModal.tsx`, `LiveRequestPopup.tsx`, `CounterOfferSheet.tsx` | Tab cycles within modal |
| P0-14 | Fix clickable div in OfferComparisonDemo | `OfferComparisonDemo.tsx` | Use `<button>` or `<Link>` with keyboard handler |
| P0-15 | Add `type="button"` to dashboard buttons | `TutorDashboard.tsx`, `StudentDashboard.tsx` | No accidental form submissions |

### P1 — GROWTH (Ship in sprints 3-6)

**Goal:** Close retention, parent, and demand-SEO gaps. Build the recurring learning economy.

| # | Task | Files | Validation |
|---|---|---|---|
| P1-1 | Build real offer comparison workspace | `OfferComparisonModal.tsx` (activate), `offer.controller.ts` | Student can side-by-side compare 3-5 offers with match score, qualifications, rate, availability |
| P1-2 | Add parent/guardian accounts | New `ParentGuardian.model.ts`, `StudentProfile.model.ts` extension, parent dashboard | Parent can manage child profiles, view requests/bookings, set safety preferences |
| P1-3 | Add StudentTutorRelationship model | New model + `Booking` extension | Track first booking, completed sessions, repeat count, current arrangement |
| P1-4 | Rebooking with one click | `StudentDashboard.tsx`, `TutorDashboard.tsx` | "Book Again" pre-fills tutor, subject, mode, availability, agreed rate |
| P1-5 | Recurring lesson scheduling | `BookedSlot.model.ts` extension, new `RecurringBooking.model.ts` | Weekly, twice-weekly, monthly schedules |
| P1-6 | Session packages | New `Package.model.ts`, `PackageType` enum (4-session, 8-session, monthly) | Student buys package, bookings deduct from balance |
| P1-7 | Post-session review request automation | `requestLifecycle.service.ts`, `emailTemplates.ts` | Student receives review request 1h after session completion |
| P1-8 | Pricing intelligence | `matching.service.ts` extension, new `PricingInsight.model.ts` | "Similar tutors in Lahore charge PKR X-Y/hour" shown during request creation |
| P1-9 | Demand SEO pages | New `app/tuition-requests/[country]/[city]/[subject]/page.tsx` | Anonymized, aggregated demand pages indexed by Google |
| P1-10 | `llms.txt` + canonical platform description | `public/llms.txt`, `layout.tsx` | Machine-readable platform identity for AI/LLM crawlers |
| P1-11 | Unified design system | New `src/styles/tokens.css`, shared `Card.tsx`, `Button.tsx`, `Badge.tsx` | Replace 30+ inline button styles, 10+ inline card styles |
| P1-12 | Content moderation on uploads | `upload.middleware.ts`, Cloudinary add-on or third-party API | Images/videos screened for inappropriate content |
| P1-13 | Admin bulk actions | Admin table pages | Bulk select, bulk status update, bulk export |
| P1-14 | Fix sitemap performance | `sitemap.ts` | Cache sitemap, reduce fetch limit, cron-generated XML |
| P1-15 | Admin 360° pages wiring | New `admin/students/[id]/page.tsx`, `admin/tutors/[id]/page.tsx` | Wire existing `getStudent360`/`getTutor360` to frontend |

### P2 — MARKET LEADERSHIP (Sprints 7-12+)

**Goal:** Data intelligence, ML, market expansion, defensible moats.

| # | Task | Files | Validation |
|---|---|---|---|
| P2-1 | TUTORERA Match Graph | New `MatchGraph.model.ts` or analytics pipeline | Connect student → request → subject → curriculum → city → budget → schedule → tutor → match → offer → booking → review → repeat |
| P2-2 | ML reranking | `matching.service.ts` extension | Train on `MatchLog.feedbackScore` + booking outcomes, A/B test against rule-based |
| P2-3 | Booking probability model | New `BookingProbability.model.ts` | P(successful completed booking \| student, tutor, request, offer, context) |
| P2-4 | Dynamic liquidity intelligence | `adminControlTower.controller.ts` extension | 0-100 liquidity score per city×subject×mode, surfaced in admin and tutor dashboard |
| P2-5 | Market expansion recommendations | New `MarketExpansionService` | "O-Level Physics Dubai has critical supply gap — recruit tutors" |
| P2-6 | Tutor quality score (public) | `TutorProfile.model.ts` extension, `TutorCard.tsx` | Composite score from verification, completion rate, ratings, response time, disputes |
| P2-7 | Tutor payout automation | `earnings.controller.ts`, payout provider integration | Auto-payout on booking completion + confirmation period |
| P2-8 | Off-platform circumvention detection | `contentFilter.ts` + `antiCircumvention.ts` (activate) | Scan chat messages for phone/email/WhatsApp/bank details, risk-flag |
| P2-9 | Recurring re-verification | `requestLifecycle.service.ts`, tracking system | Police cert expiry alerts, CNIC expiry monitoring |
| P2-10 | Parent/guardian controls | Extend P1-2 | Safety preferences, spending limits, tutor approval workflow |
| P2-11 | Global market expansion | `MarketConfig.model.ts`, `geo.controller.ts` | Launch gates for new countries (legal, payment, verification, supply threshold) |
| P2-12 | TUTORERA Tutoring Index | New `ResearchPage` + data pipeline | Anonymized aggregate reports: tutor rates by city, most requested subjects, home vs online demand |
| P2-13 | A/B testing framework | New `Experiments.model.ts`, middleware | Test matching weights, UI variants, email copy, pricing displays |
| P2-14 | Advanced personalization | `MatchingService` extension | Tutor recommendation based on learning style, session history, repeat student patterns |

---

## PART 6 — NORTH STAR METRICS & FUNNEL

### North Star
**Successful Student Bookings Per Week** (completed + satisfactory)

### Supporting Metrics

| Funnel Stage | Metric | Current | Target |
|---|---|---|---|
| Visitor → Request Started | Conversion | — | 15% |
| Request Started → Published | Completion | — | 80% |
| Published → First Offer | Time to first offer | — | < 2h |
| Published → 3 Qualified Offers | Coverage | — | 70% |
| Offer Viewed → Negotiation | Engagement | — | 40% |
| Negotiation → Tutor Selected | Close rate | — | 60% |
| Selected → Checkout | Conversion | — | 85% |
| Checkout → Payment | Success rate | — | 90% |
| Payment → Session Completed | Completion | — | 85% |
| First Session → Repeat | Retention | — | 40% |
| 30-Day Retention | Repeat booking | — | 35% |
| Tutor Response Rate | Offer acceptance | — | > 50% |
| Verification Turnaround | SLA | — | < 24h |

### Marketplace Health Metrics

| Metric | Formula | Target |
|---|---|---|
| Request → Offer Conversion | offers / requests | > 3.0 |
| Request → Booking Conversion | bookings / requests | > 0.4 |
| Offer → Booking Conversion | bookings / offers | > 0.15 |
| Median First Offer Time | minutes from request to first offer | < 120 |
| Qualified Offer Coverage | requests with ≥3 offers / total requests | > 0.7 |
| Tutor Win Rate | accepted bids / total bids | > 0.15 |
| Student Repeat Rate | students with 2+ bookings / total students | > 0.3 |
| Tutor Rebooking Rate | tutors with repeat bookings / total tutors | > 0.4 |

---

## PART 7 — ARCHITECTURE PRINCIPLES

1. **Do not rebuild working functionality.** The backend matching engine, payment flow, and verification system are production-grade. Frontend changes should wrap existing APIs, not replace them.
2. **Automation first, admin intervention by exception.** The at-risk request rescue, supply-gap intelligence, and lifecycle workers already embody this. Extend, don't replace.
3. **No lead fees, no bidding credits.** This is the core differentiation from UrbanPro. Never introduce pay-per-lead mechanics.
4. **Student-led, not tutor-led.** The homepage, request flow, and comparison UX must center the student's requirement, not tutor discovery.
5. **Trust before transaction.** Verification badges, police clearance, demo videos, and audit logs must be visible at every decision point.
6. **Transparent negotiation.** Every counter-offer, every state change, every audit event must be visible to both parties.
7. **Design system consistency.** Replace inline styles with CSS tokens and shared components. One button, one card, one badge implementation.
8. **RBAC enforcement.** Frontend guards + backend middleware must both enforce permissions. UI-only RBAC is a liability.
9. **No fake data.** Demand pages, SEO pages, and marketplace metrics must use real, anonymized transaction data.
10. **Accessibility is non-negotiable.** WCAG 2.2 AA compliance: focus management, keyboard navigation, ARIA labels, touch targets, reduced motion.

---

## PART 8 — REMAINING GAPS (After P0 + P1)

| Gap | Phase | Notes |
|---|---|---|
| Parent/guardian accounts | P1 | Child profile management, spending controls |
| Recurring bookings/packages | P1 | 4-session, 8-session, monthly plans |
| ML reranking | P2 | Train on MatchLog.feedbackScore + booking outcomes |
| Match Graph | P2 | Proprietary data moat |
| Pricing intelligence | P1 | Anonymized rate ranges |
| Demand SEO pages | P1 | City × subject × curriculum |
| `llms.txt` | P1 | LLMO optimization |
| Content moderation | P1 | Image/video screening |
| Tutor payout automation | P2 | NayaPay/backend integration |
| Off-platform detection | P2 | Chat scanning + risk flagging |
| A/B testing framework | P2 | Experimentation platform |
| Global market expansion | P2 | Launch gates for new countries |
| TUTORERA Tutoring Index | P2 | SEO/PR/backlink asset |

---

## PART 9 — NEXT STEPS

1. **Review this document** with the team and prioritize P0 items
2. **Start P0-1 (RBAC enforcement)** — highest security/UX risk
3. **Start P0-4 (tracking email branding)** — quick win, visible quality improvement
4. **Start P0-10 (match score on tutor cards)** — core differentiator, low effort
5. **Plan P1-1 (real offer comparison workspace)** — highest user-facing gap after P0 fixes
6. **Schedule P1-2 (parent accounts) and P1-3 (recurring bookings)** for sprint after P1-1

---

*End of audit. All findings are based on direct file reads and agent audits of the codebase at commit `6267795` and working tree state as of 2026-09-06.*
