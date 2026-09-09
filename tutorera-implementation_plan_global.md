# Global Platform Transformation – Full Implementation Plan

## Goal Description

Refactor the entire Tutorera codebase from a Pakistan‑centric marketplace into a truly **global, multi‑country, multi‑city, multi‑currency, multilingual** tutoring platform. The transformation covers database schema, backend services, frontend UI/UX, admin tooling, payment/payout abstractions, localization, compliance, SEO, and operational workflows while preserving existing data and ensuring a seamless migration.

## User Review Required

> [!IMPORTANT]
> Review the high‑level phases and confirm any preferred technologies or existing constraints (e.g., database engine, i18n library, payment gateway preferences, deployment environment). Let me know if any section should be split or reordered before I start implementation.

## Open Questions

> [!WARNING]
> - **Location data source**: Should we import an external dataset (e.g., GeoNames, OpenStreetMap) or use a curated JSON file? Any licensing constraints?
> - **i18n framework**: Frontend currently uses a custom `src/lib/countries.ts`. Do you prefer `next-intl`, `react-i18next`, or another solution?
> - **Payment provider abstraction**: Which providers must be supported at launch (e.g., Stripe, PayPal, Razorpay)? Do you have existing API keys or sandbox credentials?
> - **Deployment target**: Are we deploying to Vercel (frontend) and Render (backend) as currently configured, or should we switch to a different CI/CD pipeline?
> - **Feature flag system**: Do you have an existing flag service (LaunchDarkly, Unleash) or should we implement a simple DB‑backed flag?
> - **Admin UI framework**: Existing admin UI uses custom components. Should we adopt a design system (e.g., MUI) for consistency?
> - **Search engine**: Are we using Meilisearch/Algolia already, or should we introduce one?
> - **Data migration window**: Preferred timeframe for migration of existing PK data to the new normalized schema?

## Proposed Changes

---
### Phase 0 – Foundations (1 week)

1. **Repository restructure** – Add a `global` folder for shared assets (location data, i18n, config). Ensure both `tutorera-backend` and `tutorera-frontend` reference it via TypeScript path mapping.
2. **Tooling** – Install/upgrade:
   - `i18next` + `react-i18next` (frontend) with TypeScript types.
   - `mongoose` v7 (backend) if not already.
   - `dotenv` for per‑environment config.
   - `node‑cron` for scheduled jobs (currency rates, cron‑based tasks).
3. **Feature‑flag base** – Introduce a simple DB collection `feature_flags` with fields `{ key: string, enabled: boolean, scope?: "global" | "country" }`. Add a thin wrapper library.
4. **CI/CD** – Add GitHub Actions steps to lint, test, and build both apps. Ensure secrets for payment providers are available.

---
### Phase 1 – Global Location Architecture (2 weeks)

- **Create `location.ts`** (backend) defining `Country`, `Region`, `City`, `Area` interfaces and exporting a `COUNTRIES` map (see earlier plan). Populate it with an initial dataset for ~30 key markets using open data (GeoNames). Include flags, ISO codes, currency, timezone, phone dial code, regulatory config.
- **Create `location` service** for lookups, fuzzy search, and hierarchical navigation.
- **Mongoose schema** `Location` with indexes on `countryCode`, `city`, `region` for fast queries.
- **Admin UI** – Build "Geography" section to import/export CSV/JSON, enable/disable countries/regions, and edit hierarchical data.
- **Frontend** – Implement an async searchable country/region/city selector using `react-select` with lazy loading from the `/api/locations` endpoint.
- **Migration** – Script `scripts/migrate_existing_locations.ts` to map current hard‑coded PK records to the new location IDs.

---
### Phase 2 – Internationalization & RTL (2 weeks)

- **i18n layer** – Set up `i18next` with locale files (`en.json`, `ar.json`, `ur.json`, etc.) using translation keys across the codebase.
- **Locale detection** – Middleware reads `Accept-Language`, IP geolocation, or user profile to set locale in a cookie.
- **RTL support** – Add global CSS variables `--direction` and `direction: var(--direction)`; use logical properties (`margin-inline-start`). Update `next.config.js` to inject direction into SSR.
- **Date/Number format helpers** – `formatNumber`, `formatDate` based on `Intl` and locale.
- **Admin UI** – “Languages” page to upload new locale JSON files.

---
### Phase 3 – Global Profile Refactor (3 weeks)

- **Database** – New collections: `student_profiles`, `parent_profiles`, `tutor_profiles` with reference to `Location` via `countryCode`, `regionCode`, `cityId`.
- **Schema changes** – Add fields for curriculum, language preferences, budgets, preferred teaching mode, verification status, etc., all country‑aware.
- **API** – Update POST/PUT endpoints to accept the new structure; add validation middleware that reads country‑specific rules from `country_configs`.
- **Frontend forms** – Replace hard‑coded selects with the async location selector and dynamic curriculum list based on selected country.
- **Verification abstraction** – Create `verification_types` collection with per‑country definitions (e.g., CNIC, Passport, DriverLicense). UI renders appropriate options.

---
### Phase 4 – Currency & Pricing Engine (2 weeks)

- **Currency model** – `Currency` collection storing ISO code, symbol, precision.
- **FeeConfig model** – As defined earlier, but expanded to include `countryCode` and `serviceType` (online/home).
- **Exchange rate service** – Background job pulling rates from an open API (e.g., exchangerate.host) hourly, storing in `exchange_rates` collection.
- **Pricing helpers** – `convertAmount(amount, fromCurrency, toCurrency)` used in all price displays and payment calculations.
- **Payment abstraction** – Interface `PaymentProvider` with implementations `StripeProvider`, `PayPalProvider`, `RazorpayProvider`. Admin can map providers per country.

---
### Phase 5 – Matching Engine & Offer Workflow (3 weeks)

- **Scoring algorithm** – Implement a modular scoring module (`matchingEngine.ts`) that reads configurable weightings from `matching_rules` collection (global and per‑country overrides).
- **Distance calculation** – Use Haversine formula on stored city coordinates for home‑tuition matches.
- **Offer model** – `Offer` collection with fields: `requestId`, `tutorId`, `price`, `currency`, `status`, `negotiationHistory`.
- **Negotiation flow** – API endpoints for `counterOffer`, `acceptOffer`, `rejectOffer`. Business logic ensures currency consistency and time‑zone conversion.
- **Frontend** – Offer card component displaying tutor info, badges, price, and action buttons.
- **Notifications** – Extend notification service to emit locale‑aware templates for offer events.

---
### Phase 6 – Admin Panel Overhaul (4 weeks)

- **Navigation** – New top‑level sections: Geography, Countries, Languages, Payment Providers, Fee Configs, Matching Rules, Feature Flags, Analytics.
- **Dynamic forms** – Reusable form generator based on JSON schema for each entity.
- **Analytics dashboards** – Use Chart.js or Recharts with filters for country, city, currency, time‑frame.
- **Role‑based access** – Extend RBAC to include `country_admin` role with scoped permissions.
- **SEO management** – UI to edit meta tags, hreflang entries, and generate sitemap entries per country/city.

---
### Phase 7 – Global Search & SEO (2 weeks)

- **Search index** – Deploy Meilisearch (or Algolia) with documents for tutors, requests, courses, locations.
- **Indexing pipeline** – Queue worker that syncs MongoDB changes to the search engine.
- **Search API** – `/api/search?q=...&locale=en&country=GB` that returns localized results.
- **Sitemap generation** – Script that emits static `/sitemap-<country>.xml` files and a master sitemap with hreflang.
- **Structured data** – Add JSON‑LD snippets on tutor and request pages (Organization, Service, Offer).

---
### Phase 8 – Payments, Payouts & Tax (3 weeks)

- **Payment provider registry** – `payment_providers` collection mapping country code → provider config (API keys, supported currencies).
- **Checkout flow** – Frontend calls `/api/payments/checkout` with amount & currency; backend selects the appropriate provider.
- **Payout service** – `PayoutProviderInterface` with adapters for Stripe Connect, PayPal Payouts, local bank transfers.
- **Tax module** – `TaxConfig` per country (VAT/GST rates, thresholds). Invoices include tax breakdown.
- **Invoice generation** – PDF generation using `pdfkit` with localized language and currency.

---
### Phase 9 – Mobile‑First UI & Accessibility (2 weeks)

- **Responsive redesign** – Ensure all pages use CSS Grid/Flexbox with breakpoints up to 4xl.
- **Component library** – Build a design system (`ds/`) with tokens (colors, spacing, typography) that supports RTL.
- **Accessibility audit** – Run axe-core, fix ARIA labels, focus order, color contrast.
- **Testing** – Cypress end‑to‑end tests on mobile viewports.

---
### Phase 10 – Data Migration & Rollout (2 weeks)

- **Migration scripts** – `scripts/migrate_locations.ts`, `scripts/migrate_profiles.ts`, `scripts/migrate_fees.ts` to back‑fill new collections while preserving IDs.
- **Backup & Restore plan** – Full MongoDB dump before migration; test restore in staging.
- **Feature‑flag rollout** – Deploy with `ENABLE_GLOBAL_PLATFORM` off. Enable gradually per country using admin flags.
- **Canary testing** – Route 5 % of traffic from a new country (e.g., UAE) through the new stack; monitor errors.
- **Monitoring** – Grafana dashboards for error rates, payment success, matching latency per country.

---
## Verification Plan

### Automated Tests
- **Unit**: All new utilities (location lookup, currency conversion, i18n helpers) have 100 % coverage.
- **Integration**: Endpoints for profile creation, request posting, and offer flow are tested with multiple countries.
- **E2E (Playwright)**: Full student‑tutor negotiation flow across three locales (en, ar, ur).

### Manual QA
- Verify UI for at least five representative markets (PK, US, AE, DE, IN).
- Validate payment flows with sandbox credentials for Stripe (USD) and Razorpay (INR).
- Confirm RTL layout for Arabic/Urdu.
- Test admin country activation without code changes.

---
## Rollout Strategy

| Wave | Countries | Duration | Success Criteria |
|------|-----------|----------|------------------|
| **Pilot** | PK, AE | 2 weeks | <0.1 % error rate, payment success ≥99 % |
| **Wave 1** | US, GB, IN | 3 weeks | Matching latency ≤500 ms, GDPR compliance check |
| **Wave 2** | CA, AU, DE, SA | 3 weeks | All admin config options functional |
| **Wave 3** | Remaining markets | 4 weeks | Global analytics stable, no critical bugs |

Feature flags allow immediate rollback per country.

---
## Deliverables

1. **Database schema** (MongoDB models, indexes, migration scripts).
2. **Backend services** (location, i18n, payment, payout, tax, matching, notifications).
3. **Frontend redesign** (global selector, RTL, responsive components, localized strings).
4. **Admin panel** (geography management, config UI, analytics, role‑based access).
5. **Search & SEO infrastructure** (search engine, sitemap, structured data).
6. **Payment abstraction** (provider plugins, country mapping).
7. **Documentation** (architecture diagram, API spec, deployment runbooks).
8. **Automated test suite** (unit, integration, E2E).
9. **Migration plan** for existing Pakistan data.
10. **Monitoring & alerting** configuration.

*This plan awaits your approval before any code changes are performed.*
