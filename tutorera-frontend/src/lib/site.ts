export const SITE_URL = "https://tutorera.ac.pk";
export const BRAND_NAME = "TUTORERA by MENTISERA";
export const PLATFORM_NAME = "TUTORERA";
export const LEGAL_OPERATOR = "MENTISERA (SMC-Private) Limited";
export const SUPPORT_EMAIL = "hello@mentisera.pk";
export const SUPPORT_PHONE = "+92 334 8880859";
export const BUSINESS_ADDRESS = "House 387, Street 11, Phase 5-b, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan";

// Authoritative frontend mirror of backend MARKETPLACE_FEES. Historical bookings store a snapshot.
export const MARKETPLACE_FEES = Object.freeze({ studentPlatformFeePercent: 0, tutorPlatformFeePercent: 20, taxRatePercent: 15, minimumFee: 0, currency: "PKR", effectiveFrom: "2026-08-30" });
export const PLATFORM_FEE_PERCENT = MARKETPLACE_FEES.tutorPlatformFeePercent;
export const GST_ON_PLATFORM_FEE_PERCENT = MARKETPLACE_FEES.taxRatePercent;
export const GST_EFFECTIVE_PERCENT = (PLATFORM_FEE_PERCENT * GST_ON_PLATFORM_FEE_PERCENT) / 100;
export const TOTAL_FEE_PERCENT = PLATFORM_FEE_PERCENT + GST_EFFECTIVE_PERCENT;
export function calculateMarketplaceFees(subtotal:number){const studentFee=Math.max(MARKETPLACE_FEES.minimumFee,Math.round(subtotal*MARKETPLACE_FEES.studentPlatformFeePercent/100));const tutorFee=Math.max(MARKETPLACE_FEES.minimumFee,Math.round(subtotal*PLATFORM_FEE_PERCENT/100));const tax=Math.round(tutorFee*GST_ON_PLATFORM_FEE_PERCENT/100);return{subtotal,studentFee,tutorFee,tax,studentTotal:subtotal+studentFee,tutorNet:subtotal-tutorFee-tax};}
export function formatPKR(amount: number, unit?: string) {
  const formatted = `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
  return unit ? `${formatted} / ${unit}` : formatted;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}
