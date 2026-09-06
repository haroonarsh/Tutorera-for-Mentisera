// src/config/matchingConfig.ts
// Centralized, configurable weights, thresholds, and Bayesian constants for TUTORERA Smart Matching Engine

export interface MatchingWeights {
  subject: number;
  levelCurriculum: number;
  availability: number;
  mode: number;
  budget: number;
  location: number;
  language: number;
  quality: number;
  experience: number;
  reliability: number;
  verification: number;
}

export interface MatchingConfigData {
  algorithmVersion: string;
  onlineWeights: MatchingWeights;
  homeWeights: MatchingWeights;
  thresholds: {
    excellent: number;
    strong: number;
    good: number;
    notificationMinimum: number;
  };
  bayesian: {
    globalMeanRating: number;
    minReviewThreshold: number;
  };
  coldStart: {
    explorationRatio: number; // 0.15 = 15% exploration
    newTutorDaysWindow: number; // 30 days
    newTutorQualityScore: number; // 4.85
  };
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfigData = {
  algorithmVersion: "RULE_V1",
  onlineWeights: {
    subject: 20,
    levelCurriculum: 16,
    availability: 15, // includes timezone alignment
    mode: 10,
    budget: 12,
    location: 0, // location not weighted for online
    language: 7,
    quality: 8, // Bayesian rating + degrees
    experience: 5,
    reliability: 5,
    verification: 2,
  },
  homeWeights: {
    subject: 18,
    levelCurriculum: 14,
    availability: 14,
    mode: 10,
    budget: 10,
    location: 15, // proximity & travel radius
    language: 5,
    quality: 6,
    experience: 4,
    reliability: 2,
    verification: 2,
  },
  thresholds: {
    excellent: 90,
    strong: 80,
    good: 70,
    notificationMinimum: 60,
  },
  bayesian: {
    globalMeanRating: 4.85,
    minReviewThreshold: 5,
  },
  coldStart: {
    explorationRatio: 0.15,
    newTutorDaysWindow: 30,
    newTutorQualityScore: 4.85,
  },
};

// Subject Alias & Domain Specialization Map (Bidirectional & Synonym Normalized)
export const SUBJECT_ALIASES: Record<string, { primary: string; related: string[] }> = {
  mathematics: { primary: "Mathematics", related: ["Math", "Maths", "Calculus", "Algebra", "Statistics", "Geometry", "Trigonometry", "Pure Mathematics", "Further Mathematics"] },
  math: { primary: "Mathematics", related: ["Mathematics", "Maths", "Calculus", "Algebra", "Statistics", "Geometry", "Trigonometry"] },
  maths: { primary: "Mathematics", related: ["Mathematics", "Math", "Calculus", "Algebra", "Statistics", "Geometry", "Trigonometry"] },
  calculus: { primary: "Calculus", related: ["Mathematics", "Math", "Maths", "Algebra", "Differential Equations"] },
  algebra: { primary: "Algebra", related: ["Mathematics", "Math", "Maths", "Calculus", "Linear Algebra"] },
  statistics: { primary: "Statistics", related: ["Mathematics", "Math", "Maths", "Data Science", "Economics", "Probability"] },
  physics: { primary: "Physics", related: ["Phy", "General Science", "Science", "Mechanics", "Electronics", "Astrophysics"] },
  phy: { primary: "Physics", related: ["Physics", "General Science", "Science", "Mechanics"] },
  chemistry: { primary: "Chemistry", related: ["Chem", "General Science", "Science", "Organic Chemistry", "Inorganic Chemistry", "Biochemistry"] },
  chem: { primary: "Chemistry", related: ["Chemistry", "General Science", "Science", "Organic Chemistry"] },
  biology: { primary: "Biology", related: ["Bio", "General Science", "Science", "Zoology", "Botany", "MDCAT", "Genetics"] },
  bio: { primary: "Biology", related: ["Biology", "General Science", "Science", "Zoology", "Botany", "MDCAT"] },
  science: { primary: "General Science", related: ["Physics", "Chemistry", "Biology", "General Science", "Sciences"] },
  "general science": { primary: "General Science", related: ["Science", "Physics", "Chemistry", "Biology", "Sciences"] },
  english: { primary: "English", related: ["Eng", "IELTS", "TOEFL", "Spoken English", "Grammar", "Literature", "Creative Writing"] },
  eng: { primary: "English", related: ["English", "IELTS", "Spoken English", "Grammar"] },
  ielts: { primary: "IELTS", related: ["English", "Spoken English", "TOEFL", "Grammar"] },
  "computer science": { primary: "Computer Science", related: ["CS", "Comp Sci", "Programming", "Coding", "Python", "Web Development", "Software Engineering", "IT"] },
  cs: { primary: "Computer Science", related: ["Computer Science", "Comp Sci", "Programming", "Coding", "Python", "Web Development"] },
  "comp sci": { primary: "Computer Science", related: ["Computer Science", "CS", "Programming", "Coding", "Python"] },
  programming: { primary: "Computer Science", related: ["Computer Science", "CS", "Coding", "Python", "Web Development"] },
  accounting: { primary: "Accounting", related: ["Accounts", "Acct", "Finance", "Commerce", "Economics", "Financial Accounting"] },
  accounts: { primary: "Accounting", related: ["Accounting", "Acct", "Finance", "Commerce", "Economics"] },
  economics: { primary: "Economics", related: ["Econ", "Commerce", "Business Studies", "Finance", "Microeconomics", "Macroeconomics"] },
  econ: { primary: "Economics", related: ["Economics", "Commerce", "Business Studies", "Finance"] },
  "business studies": { primary: "Business Studies", related: ["Business", "Commerce", "Economics", "Management", "Marketing"] },
  business: { primary: "Business Studies", related: ["Business Studies", "Commerce", "Economics", "Management"] },
  islamiyat: { primary: "Islamiyat", related: ["Islamiat", "Islamic Studies", "Quran", "Arabic", "Deeniyat"] },
  islamiat: { primary: "Islamiyat", related: ["Islamiyat", "Islamic Studies", "Quran", "Arabic"] },
  "islamic studies": { primary: "Islamiyat", related: ["Islamiyat", "Islamiat", "Quran", "Arabic"] },
  "pakistan studies": { primary: "Pakistan Studies", related: ["Pak Studies", "PST", "History", "Geography of Pakistan"] },
  "pak studies": { primary: "Pakistan Studies", related: ["Pakistan Studies", "PST", "History"] },
  pst: { primary: "Pakistan Studies", related: ["Pakistan Studies", "Pak Studies", "History"] },
  urdu: { primary: "Urdu", related: ["Spoken Urdu", "Urdu Literature", "Adab"] },
  "quran & arabic": { primary: "Quran & Arabic", related: ["Quran", "Arabic", "Tajweed", "Quran Recitation", "Hifz", "Islamiyat"] },
  quran: { primary: "Quran & Arabic", related: ["Quran & Arabic", "Arabic", "Tajweed", "Islamiyat"] },
  arabic: { primary: "Quran & Arabic", related: ["Quran & Arabic", "Quran", "Tajweed"] },
  mdcat: { primary: "MDCAT", related: ["Biology", "Chemistry", "Physics", "Bio", "Chem", "Phy"] },
  ecat: { primary: "ECAT", related: ["Mathematics", "Physics", "Chemistry", "Math", "Phy", "Chem"] },
  sat: { primary: "SAT", related: ["Mathematics", "English", "Math", "Eng", "ACT"] },
};

// Canonical Academic Level Normalizer
export function normalizeLevel(levelStr?: string): string {
  if (!levelStr) return "Other";
  const clean = levelStr.trim().toLowerCase().replace(/[-_ ]/g, "");
  if (clean.includes("primary") || clean.includes("elementary") || clean.includes("grade1") || clean.includes("grade2") || clean.includes("grade3") || clean.includes("grade4") || clean.includes("grade5")) return "Primary";
  if (clean.includes("middle") || clean.includes("grade6") || clean.includes("grade7") || clean.includes("grade8")) return "Middle";
  if (clean.includes("matric") || clean.includes("ssc") || clean.includes("grade9") || clean.includes("grade10")) return "Matric";
  if (clean.includes("olevel") || clean.includes("igcse") || clean.includes("cambridgeo")) return "O-Level";
  if (clean.includes("inter") || clean.includes("fsc") || clean.includes("hssc") || clean.includes("grade11") || clean.includes("grade12") || clean.includes("fa") || clean.includes("ics") || clean.includes("icom")) return "Intermediate";
  if (clean.includes("alevel") || clean.includes("cambridgea") || clean.includes("gce")) return "A-Level";
  if (clean.includes("uni") || clean.includes("bachelor") || clean.includes("undergrad") || clean.includes("master") || clean.includes("degree") || clean.includes("bs") || clean.includes("ms")) return "University";
  return "Other";
}

// Academic Level Hierarchy & Compatibility
export const LEVEL_HIERARCHY: Record<string, number> = {
  Primary: 1,
  Middle: 2,
  Matric: 3,
  "O-Level": 3,
  Intermediate: 4,
  "A-Level": 4,
  University: 5,
  Other: 3,
};

