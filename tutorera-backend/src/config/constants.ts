// Authoritative marketplace fee configuration. Historical bookings snapshot these values.
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

export function calculateMarketplaceFees(subtotal: number) {
  const studentFee = Math.max(MARKETPLACE_FEES.minimumFee, Math.round(subtotal * MARKETPLACE_FEES.studentPlatformFeePercent / 100));
  const tutorFee = Math.max(MARKETPLACE_FEES.minimumFee, Math.round(subtotal * MARKETPLACE_FEES.tutorPlatformFeePercent / 100));
  const tax = Math.round(tutorFee * MARKETPLACE_FEES.taxRatePercent / 100);
  return { subtotal, studentFee, tutorFee, tax, studentTotal: subtotal + studentFee, tutorNet: subtotal - tutorFee - tax, feeConfig: MARKETPLACE_FEES };
}

