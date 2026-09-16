// Reporting-only defaults, used solely for rough analytics/revenue estimates
// in admin.controller.ts. The live, authoritative fee/tax/gateway-cost
// calculation for every real booking is calculateMarketplaceFees() in
// services/pricing.service.ts, which reads FeeConfig and TaxConfig from the
// database instead of these hardcoded numbers.
export const MARKETPLACE_FEES = Object.freeze({
  studentPlatformFeePercent: 0,
  tutorPlatformFeePercent: 20,
  taxRatePercent: 15,
  minimumFee: 0,
  currency: "PKR",
  effectiveFrom: "2026-08-30",
});
export const PLATFORM_FEE_PERCENT = MARKETPLACE_FEES.tutorPlatformFeePercent;
export const GST_PERCENT = MARKETPLACE_FEES.taxRatePercent;
export const GST_ON_FEE = (PLATFORM_FEE_PERCENT * GST_PERCENT) / 100;
export const TOTAL_FEE_PERCENT = PLATFORM_FEE_PERCENT + GST_ON_FEE;

