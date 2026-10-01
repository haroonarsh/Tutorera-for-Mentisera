# Switch Payment Migration

## Current implementation

TUTORERA uses a single Switch adapter for hosted checkout and server-side payment-session confirmation. RapidPay configuration, UI terminology and market-provider references have been removed. Historic ledger rows retain their recorded provider name for auditability.

## Safe rollout

1. Obtain Switch written confirmation for each market: merchant onboarding entity, allowed collection currency, payout/settlement currency and method, KYC/AML obligations, callback/IP allow-list requirements, refunds and chargeback process.
2. Set `SWICH_AUTH_BASE_URL`, `SWICH_API_BASE_URL`, `SWICH_CLIENT_ID`, `SWICH_CLIENT_SECRET`, `SWICH_SUPPORTED_MARKETS`, and `SWICH_SUPPORTED_CURRENCIES` in Render.
3. Run `npx ts-node src/scripts/migrateSwitchOnlyPayments.ts` against a production backup/staging clone first.
4. Verify a real checkout, return-status confirmation, refund, payout, ledger event and reconciliation workflow for each approved market.
5. Enable the corresponding market through its audited market configuration only after the above evidence is retained.

## Product decisions still required

- Switch's public API documentation confirms Pay In, local IBFT payouts and international remittance, but does not publish a merchant-specific AE/GB/US/SA/IN currency and settlement matrix. Do not activate those checkout markets until Switch confirms support contractually.
- Decide whether tutors may receive cross-border payouts directly from Switch, through a licensed local payout partner, or only after local entity/KYC onboarding.
- Confirm whether marketplace escrow/held funds are permitted in each market; payment collection alone does not establish escrow compliance.

## API behavior

`assertAcceptanceAvailable` and checkout creation now return `SWICH_MARKET_OR_CURRENCY_UNSUPPORTED` when a market/currency pair is not explicitly approved. This avoids starting a payment that cannot settle.
