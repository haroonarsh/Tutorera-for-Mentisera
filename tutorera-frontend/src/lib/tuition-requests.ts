const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";

// Shape of the sanitized student embedded in a public preview payload —
// the backend never sends _id, email, avatar, phone, or exact address on
// this endpoint (see request-privacy.test.ts and getPublicRequestsPreview
// in tutorera-backend). Keep this type honest to that redaction, so it
// can't quietly widen if a future change starts sending more.
export interface StudentUser {
  name: string;
  displayTitle?: string;
  city?: string;
  countryName?: string;
}

export interface TuitionRequest {
  _id: string;
  student: StudentUser;
  subject: string;
  level: string;
  // Always the canned "Learning goals will be shared after a tutor is
  // selected." placeholder on the public preview — never the real body.
  description: string;
  budget: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  currency: string;
  countryCode?: string;
  countryName?: string;
  city?: string;
  teachingMode: "online" | "in-person" | "both";
  schedule: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
  offersCount?: number;
  sessionDurationMinutes?: number;
  sessionsPerWeek?: number;
}

export interface RequestFilters {
  subject?: string;
  level?: string;
  city?: string;
  country?: string;
  teachingMode?: string;
  currency?: string;
  page?: string;
}

export interface RequestDirectoryResponse {
  requests: TuitionRequest[];
  total: number;
  page: number;
  pages: number;
}

export async function fetchRequests(filters: RequestFilters = {}, limit = 12): Promise<RequestDirectoryResponse> {
  const params = new URLSearchParams({ limit: String(limit), page: filters.page || "1" });
  const { subject, level, city, country, teachingMode, currency } = filters;
  if (subject) params.set("subject", subject);
  if (level) params.set("level", level);
  if (city) params.set("city", city);
  if (country) params.set("country", country);
  if (teachingMode && teachingMode !== "all") params.set("teachingMode", teachingMode);
  if (currency) params.set("currency", currency);

  try {
    const response = await fetch(`${API_URL}/requests/public/preview?${params}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`Request API returned ${response.status}`);
    const data = await response.json();
    const requests: TuitionRequest[] = data.requests ?? [];
    return {
      requests,
      total: data.total ?? requests.length,
      page: data.page ?? 1,
      pages: data.totalPages ?? data.pages ?? 1,
    };
  } catch (error) {
    console.error("Unable to load tuition requests", error);
    return { requests: [], total: 0, page: 1, pages: 1 };
  }
}

export function formatBudget(amount: number, currency: string, pricingUnit: string): string {
  const symbol = currency === "PKR" ? "Rs." : currency === "AED" ? "AED " : currency === "SAR" ? "SAR " : currency === "GBP" ? "£" : "$";
  const formatted = pricingUnit === "month" ? `${symbol}${amount.toLocaleString()}/mo`
    : pricingUnit === "course" ? `${symbol}${amount.toLocaleString()}/course`
    : pricingUnit === "session" ? `${symbol}${amount.toLocaleString()}/session`
    : `${symbol}${amount.toLocaleString()}/hr`;
  return formatted;
}

export function getTimeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}
