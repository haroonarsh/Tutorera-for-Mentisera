import type { TutorProfile } from "@/types/tutor";

export const SUBJECTS = {
  mathematics: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology",
  english: "English Language", urdu: "Urdu Language", arabic: "Arabic Language", persian: "Persian",
  "computer-science": "Computer Science", statistics: "Statistics", economics: "Economics",
  accounting: "Accounting", "business-studies": "Business Studies", commerce: "Commerce", history: "History",
  geography: "Geography", islamiyat: "Islamiyat", "pakistan-studies": "Pakistan Studies", civics: "Civics",
  mdcat: "MDCAT", ecat: "ECAT", sat: "SAT", ielts: "IELTS", "entry-tests": "Entry Tests",
  programming: "Programming", "web-development": "Web Development", "data-science": "Data Science",
  "graphic-design": "Graphic Design",
} as const;

export const CITIES = {
  lahore: "Lahore", karachi: "Karachi", islamabad: "Islamabad", rawalpindi: "Rawalpindi",
  faisalabad: "Faisalabad", multan: "Multan", peshawar: "Peshawar", quetta: "Quetta",
  sialkot: "Sialkot", gujranwala: "Gujranwala",
  dubai: "Dubai", "abu-dhabi": "Abu Dhabi", sharjah: "Sharjah",
  riyadh: "Riyadh", jeddah: "Jeddah", dammam: "Dammam",
  london: "London", manchester: "Manchester", birmingham: "Birmingham",
} as const;

export const LEVELS = {
  primary: "Primary (Grades 1-5)", middle: "Middle (Grades 6-8)", matric: "Matric (9th & 10th)", intermediate: "Intermediate / FSc",
  "o-level": "O-Level (Cambridge / Edexcel)", igcse: "IGCSE (Cambridge / Edexcel)", "a-level": "A-Level (Cambridge / Edexcel)", university: "University / Degree",
} as const;

export const PRIMARY_CITY_SLUGS = ["lahore", "karachi", "islamabad", "rawalpindi", "faisalabad"] as const;
export const LOCAL_SUBJECT_SLUGS = ["mathematics", "physics", "chemistry", "biology", "english", "computer-science", "mdcat", "ielts"] as const;

export type DirectoryKind = "subject" | "city" | "level";
export type TutorSearchFilters = Partial<Record<DirectoryKind | "search" | "teachingMode" | "minPrice" | "maxPrice" | "minRating" | "countryCode" | "country", string>>;

export interface TutorDirectoryResponse {
  tutors: TutorProfile[];
  total: number;
  page: number;
  pages: number;
}

export interface SeoInventory { countries: { value: string; total: number }[]; cities: { value: string; total: number }[]; subjects: { value: string; total: number }[]; levels: { value: string; total: number }[]; citySubjects: { city: string; subject: string; total: number }[]; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";

// Removed in response to the Oct 2026 indexation incident: a hardcoded
// FALLBACK_TOP_TUTORS array ("Dr. Ayesha Malik", "Engr. Bilal Khan",
// "Sarah Ahmed") with synthesized averageRating / totalReviews /
// hourlyRate / isVerified: true used to be served whenever the backend
// returned 429 or threw. That fed fabricated inventory into
// Course / AggregateRating / ItemList JSON-LD and ranked under real
// production content. Spec §42 ("never fabricate reviews, ratings,
// prices, inventory") makes this unambiguously disallowed.
//
// New policy: on any backend failure, return an empty tutor list. Pages
// degrade to their real zero-state (which already prompts "Post Your
// Requirement" and links the broader directory) rather than displaying
// imaginary tutors as real marketplace facts.

const EMPTY_RESULT: TutorDirectoryResponse = { tutors: [], total: 0, page: 1, pages: 1 };

export async function fetchTutors(filters: TutorSearchFilters = {}, limit = 24, page = 1): Promise<TutorDirectoryResponse> {
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));

  try {
    const response = await fetch(`${API_URL}/tutors?${params}`, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Tutor API returned ${response.status}`);
    const data = await response.json();
    const tutors = data.tutors ?? [];
    return { tutors, total: data.total ?? tutors.length, page: data.page ?? 1, pages: data.pages ?? 1 };
  } catch {
    return EMPTY_RESULT;
  }
}

export async function fetchSeoInventory(): Promise<SeoInventory> {
  try {
    const response = await fetch(`${API_URL}/public/seo-inventory`, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error("SEO inventory unavailable");
    const data = await response.json();
    return data;
  } catch {
    return { countries: [], cities: [], subjects: [], levels: [], citySubjects: [] };
  }
}

export async function fetchTutor(id: string): Promise<TutorProfile | null> {
  try {
    const response = await fetch(`${API_URL}/tutors/${encodeURIComponent(extractTutorId(id))}`, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    const data = await response.json();
    return data.profile ?? null;
  } catch {
    return null;
  }
}

/** Canonical SEO-friendly lookup - no ObjectId involved. `country` is
 * accepted but not required by the backend route (the slug alone is
 * globally unique); it's taken so the URL's country segment can be
 * validated/redirected against the profile's actual countrySlug by the
 * caller if they ever drift apart. */
export async function fetchTutorBySlug(country: string, slug: string): Promise<TutorProfile | null> {
  try {
    const response = await fetch(
      `${API_URL}/tutors/slug/${encodeURIComponent(country)}/${encodeURIComponent(slug)}`,
      { next: { revalidate: 900 } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.profile ?? null;
  } catch {
    return null;
  }
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type TutorLike = Pick<TutorProfile, "_id" | "subjects"> & {
  city?: string;
  countryName?: string;
  slug?: string;
  countrySlug?: string;
  user?: { name?: string; city?: string };
};

// Legacy fallback for a profile that hasn't been through the slug backfill
// migration yet (backend-persisted `slug`/`countrySlug` are missing) -
// embeds the ObjectId directly in the URL, same as before this migration.
// Prefer tutorProfileHref() below for anything with a real slug.
function legacyTutorProfileSlug(tutor: TutorLike) {
  const name = tutor.user?.name || "tutor";
  const subject = tutor.subjects?.[0] || "tutor";
  const city = tutor.city || tutor.user?.city || "pakistan";
  return `${tutor._id}-${slugify(`${name} ${subject} tutor ${city}`)}`;
}

/** The canonical, SEO-friendly public profile path: /tutors/{country}/{slug}
 * with no ObjectId in it. Falls back to the legacy ObjectId-embedded path
 * only for a profile that predates the backend slug migration. */
export function tutorProfileHref(tutor: TutorLike) {
  if (tutor.slug) {
    const country = tutor.countrySlug || slugify(tutor.countryName || "pakistan");
    return `/tutors/${country}/${tutor.slug}`;
  }
  return `/tutors/${legacyTutorProfileSlug(tutor)}`;
}

export function extractTutorId(value: string) {
  const objectId = value.match(/[a-f\d]{24}/i)?.[0];
  return objectId || value;
}
