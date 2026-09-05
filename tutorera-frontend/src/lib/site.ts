export const SITE_URL = "https://tutorera.ac.pk";
export const BRAND_NAME = "TUTORERA by MENTISERA";
export const PLATFORM_NAME = "TUTORERA";
export const LEGAL_ENTITY_NAME = "MENTISERA (SMC-Private) Limited";
export const LEGAL_OPERATOR = LEGAL_ENTITY_NAME;
export const TRADING_NAME = "TUTORERA";
export const REGISTERED_COUNTRY = "Pakistan";
export const BUSINESS_ADDRESS = "House 387, Street 11, Phase 5-b, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan";
export const REGISTERED_ADDRESS = BUSINESS_ADDRESS;

// Centralized official compliance contact points
export const SUPPORT_EMAIL = "hello@mentisera.pk";
export const LEGAL_CONTACT_EMAIL = "hello@mentisera.pk";
export const PRIVACY_CONTACT_EMAIL = "hello@mentisera.pk";
export const SAFETY_CONTACT_EMAIL = "hello@mentisera.pk";
export const SUPPORT_PHONE = "+92 334 8880859";

// Versioning constants
export const TERMS_VERSION = "2026.2-GLOBAL";
export const PRIVACY_VERSION = "2026.2-GLOBAL";
export const LAST_LEGAL_UPDATE = "September 2026";

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

export function formatMoney(amount: number, currency: string = "PKR", unit?: string) {
  const curr = (currency || "PKR").toUpperCase();
  const formatted = `${curr} ${Math.round(amount).toLocaleString()}`;
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

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
