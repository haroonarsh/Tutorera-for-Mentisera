# Switch Payment Migration

## Current implementation

TUTORERA uses a single Switch adapter for hosted checkout and server-side payment-session confirmation. All enabled launch markets use USD as the authoritative currency for newly created requests, offers, checkout and fee snapshots. Historic ledger rows, requests and bookings retain their recorded currency for auditability.

## Safe rollout

1. Set `SWICH_AUTH_BASE_URL`, `SWICH_API_BASE_URL`, `SWICH_CLIENT_ID`, `SWICH_CLIENT_SECRET`, `SWICH_SUPPORTED_MARKETS=PK,AE,GB,US,SA,IN`, and `SWICH_SUPPORTED_CURRENCIES=USD` in Render.
2. Deploy the backend. Startup automatically reconciles launch-market configuration to USD and Switch checkout.
3. Run `npx ts-node src/scripts/migrateSwitchOnlyPayments.ts` once against a production backup/staging clone first when an immediate database migration is required.
4. Verify checkout, return-status confirmation, refund, ledger event and reconciliation in every market.

## Product decisions still required

- Switch approval for USD settlement has been recorded for the configured launch markets. The public documentation still does not define the merchant-specific payout matrix, so automated tutor payouts remain disabled until Switch supplies those instructions.
- Decide whether tutors receive cross-border payouts directly from Switch, through a licensed local payout partner, or only after local entity/KYC onboarding.
- Confirm whether marketplace escrow/held funds are permitted in each market; payment collection alone does not establish escrow compliance.

## API behavior

`assertAcceptanceAvailable` and checkout creation now return `SWICH_MARKET_OR_CURRENCY_UNSUPPORTED` when a market/currency pair is not explicitly approved. This avoids starting a payment that cannot settle.

## Additive data and API changes

- `MarketConfig.paymentProvider` is restricted to `swich` or `none`; enabled launch markets use USD. Existing financial records retain their historical provider and currency values.
- `TutorProfile.onlineCountryReach` records the active online markets selected by a tutor. The onboarding API validates every selected market is active, open to tutor registration, and permits online teaching.
- `POST /tutors/onboarding/step` accepts `onlineCountryReach: string[]` in step 1. It remains backward compatible when omitted.
- Tuition-request creation already resolves the market server-side and persists its country, ISO currency, IANA timezone, and normalized location references. Matching enforces cross-border rules for online tuition and local eligibility for home tuition.
