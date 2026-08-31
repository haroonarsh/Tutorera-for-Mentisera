export const SITE_URL = "https://tutorera.ac.pk";
export const SUPPORT_EMAIL = "support@tutorera.ac.pk";

// Authoritative frontend mirror of backend MARKETPLACE_FEES. Historical bookings store a snapshot.
export const MARKETPLACE_FEES = Object.freeze({ studentPlatformFeePercent: 0, tutorPlatformFeePercent: 20, taxRatePercent: 15, minimumFee: 0, currency: "PKR", effectiveFrom: "2026-08-30" });
export const PLATFORM_FEE_PERCENT = MARKETPLACE_FEES.tutorPlatformFeePercent;
export const GST_ON_PLATFORM_FEE_PERCENT = MARKETPLACE_FEES.taxRatePercent;
export const GST_EFFECTIVE_PERCENT = (PLATFORM_FEE_PERCENT * GST_ON_PLATFORM_FEE_PERCENT) / 100;
export const TOTAL_FEE_PERCENT = PLATFORM_FEE_PERCENT + GST_EFFECTIVE_PERCENT;
export function calculateMarketplaceFees(subtotal:number){const studentFee=Math.max(MARKETPLACE_FEES.minimumFee,Math.round(subtotal*MARKETPLACE_FEES.studentPlatformFeePercent/100));const tutorFee=Math.max(MARKETPLACE_FEES.minimumFee,Math.round(subtotal*PLATFORM_FEE_PERCENT/100));const tax=Math.round(tutorFee*GST_ON_PLATFORM_FEE_PERCENT/100);return{subtotal,studentFee,tutorFee,tax,studentTotal:subtotal+studentFee,tutorNet:subtotal-tutorFee-tax};}
