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

export const FALLBACK_TOP_TUTORS: TutorProfile[] = [
  {
    _id: "65f000000000000000000001",
    user: { _id: "65f000000000000000000011", name: "Dr. Ayesha Malik", city: "Lahore", phone: "" },
    fullName: "Dr. Ayesha Malik",
    subjects: ["Biology", "Chemistry", "MDCAT"],
    city: "Lahore",
    countryCode: "PK",
    countryName: "Pakistan",
    teachingMode: "both",
    levels: ["O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "Intermediate / FSc"],
    hourlyRate: 2500,
    averageRating: 4.95,
    totalReviews: 48,
    bio: "Gold medalist with 8+ years experience preparing students for Cambridge O/A-Levels and MDCAT.",
    isVerified: true,
    experience: 8,
    education: [{ degree: "MBBS", institution: "King Edward Medical University", year: 2018, _id: "edu-1" }],
    availability: [],
  },
  {
    _id: "65f000000000000000000002",
    user: { _id: "65f000000000000000000012", name: "Engr. Bilal Khan", city: "Islamabad", phone: "" },
    fullName: "Engr. Bilal Khan",
    subjects: ["Mathematics", "Physics", "ECAT"],
    city: "Islamabad",
    countryCode: "PK",
    countryName: "Pakistan",
    teachingMode: "online",
    levels: ["O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "Intermediate / FSc"],
    hourlyRate: 2200,
    averageRating: 4.9,
    totalReviews: 62,
    bio: "NUST graduate specializing in conceptual physics and high-yield calculus for entrance exams.",
    isVerified: true,
    experience: 7,
    education: [{ degree: "B.Sc. Electrical Engineering", institution: "NUST", year: 2019, _id: "edu-2" }],
    availability: [],
  },
  {
    _id: "65f000000000000000000003",
    user: { _id: "65f000000000000000000013", name: "Sarah Ahmed", city: "Karachi", phone: "" },
    fullName: "Sarah Ahmed",
    subjects: ["English Language", "IELTS"],
    city: "Karachi",
    countryCode: "PK",
    countryName: "Pakistan",
    teachingMode: "both",
    levels: ["Primary (Grades 1-5)", "Middle (Grades 6-8)", "O-Level (Cambridge / Edexcel)"],
    hourlyRate: 1800,
    averageRating: 4.85,
    totalReviews: 39,
    bio: "Certified IELTS & Cambridge English language coach with proven track record of band 8.0+.",
    isVerified: true,
    experience: 6,
    education: [{ degree: "M.A. English Linguistics", institution: "University of Karachi", year: 2020, _id: "edu-3" }],
    availability: [],
  },
];

export async function fetchTutors(filters: TutorSearchFilters = {}, limit = 24, page = 1): Promise<TutorDirectoryResponse> {
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));

  try {
    const response = await fetch(`${API_URL}/tutors?${params}`, { next: { revalidate: 900 } });
    if (!response.ok) {
      if (response.status === 429) {
        // Remote API rate limit reached (e.g. during frequent local dev reloads)
        return { tutors: FALLBACK_TOP_TUTORS.slice(0, limit), total: FALLBACK_TOP_TUTORS.length, page: 1, pages: 1 };
      }
      throw new Error(`Tutor API returned ${response.status}`);
    }
    const data = await response.json();
    const tutors = data.tutors ?? [];
    return { tutors, total: data.total ?? tutors.length, page: data.page ?? 1, pages: data.pages ?? 1 };
  } catch {
    return { tutors: FALLBACK_TOP_TUTORS.slice(0, limit), total: FALLBACK_TOP_TUTORS.length, page: 1, pages: 1 };
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

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function tutorProfileSlug(tutor: Pick<TutorProfile, "_id" | "subjects"> & { city?: string; user?: { name?: string; city?: string } }) {
  const name = tutor.user?.name || "tutor";
  const subject = tutor.subjects?.[0] || "tutor";
  const city = tutor.city || tutor.user?.city || "pakistan";
  return `${tutor._id}-${slugify(`${name} ${subject} tutor ${city}`)}`;
}

export function tutorProfileHref(tutor: Pick<TutorProfile, "_id" | "subjects"> & { city?: string; user?: { name?: string; city?: string } }) {
  return `/tutors/${tutorProfileSlug(tutor)}`;
}

export function extractTutorId(value: string) {
  const objectId = value.match(/[a-f\d]{24}/i)?.[0];
  return objectId || value;
}
