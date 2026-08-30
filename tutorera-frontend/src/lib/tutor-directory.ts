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
} as const;

export const LEVELS = {
  primary: "Primary", middle: "Middle", matric: "Matric", intermediate: "Intermediate",
  "o-level": "O-Level", "a-level": "A-Level", university: "University",
} as const;

export type DirectoryKind = "subject" | "city" | "level";

export interface TutorDirectoryResponse {
  tutors: TutorProfile[];
  total: number;
  page: number;
  pages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";

export async function fetchTutors(filters: Partial<Record<DirectoryKind, string>> = {}, limit = 24): Promise<TutorDirectoryResponse> {
  const params = new URLSearchParams({ limit: String(limit), page: "1" });
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));

  try {
    const response = await fetch(`${API_URL}/tutors?${params}`, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Tutor API returned ${response.status}`);
    const data = await response.json();
    const tutors = data.tutors ?? [];
    return { tutors, total: data.total ?? tutors.length, page: data.page ?? 1, pages: data.pages ?? 1 };
  } catch (error) {
    console.error("Unable to load the public tutor directory", error);
    return { tutors: [], total: 0, page: 1, pages: 1 };
  }
}

export async function fetchTutor(id: string): Promise<TutorProfile | null> {
  try {
    const response = await fetch(`${API_URL}/tutors/${encodeURIComponent(id)}`, { next: { revalidate: 900 } });
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
