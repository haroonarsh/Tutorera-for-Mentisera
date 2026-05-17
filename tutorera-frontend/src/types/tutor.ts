// ─── Tutor Types ──────────────────────────────────────────────────────────────

export interface TutorUser {
  _id: string;
  name: string;
  avatar?: string;
  city: string;
  phone: string;
}

export interface TutorProfile {
  _id: string;
  user: TutorUser;
  subjects: string[];
  city: string;
  teachingMode: "online" | "in-person" | "both";
  levels: string[];           // API returns "levels" not "level"
  hourlyRate: number;
  averageRating: number;      // API returns "averageRating" not "rating"
  totalReviews: number;
  bio: string;
  isVerified: boolean;
  experience?: number;
  education: { degree: string; institution: string; year: number; _id: string }[];
  availability: { day: string; slots: string[]; _id: string }[];
  verificationStatus?: string;  
}

export interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface FiltersState {
  search: string;
  city: string;
  level: string;
  teachingMode: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sortBy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const LEVELS = [
  "Primary",
  "Middle",
  "Matric",
  "Intermediate",
  "O-Level",
  "A-Level",
  "University",
  "Other",
];

export const TEACHING_MODES = [
  { value: "online", label: "Online" },
  { value: "in-person", label: "In-Person" },
  { value: "both", label: "Both" },
];

export const CITIES = [
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Sialkot",
  "Gujranwala",
];

export const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "newest", label: "Newest" },
];

export const INITIAL_FILTERS: FiltersState = {
  search: "",
  city: "",
  level: "",
  teachingMode: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  sortBy: "rating",
};


export interface Review {
  _id: string;
  student: { name: string; avatar: string; };
  rating: number;
  comment: string;
  createdAt: string;
}