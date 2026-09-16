/** Canonical values persisted on tutor profiles. Keep display and storage aligned. */
export const EDUCATION_LEVELS = [
  "Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)",
  "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)",
  "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation", "Other",
] as const;

export type EducationLevel = typeof EDUCATION_LEVELS[number];

const aliases: Record<string, EducationLevel> = {
  "primary": "Primary (Grades 1-5)", "middle": "Middle (Grades 6-8)",
  "matric": "Matric (9th & 10th)", "matric 9th & 10th": "Matric (9th & 10th)",
  "intermediate": "Intermediate / FSc", "fsc": "Intermediate / FSc", "intermediate fsc": "Intermediate / FSc",
  "o-level": "O-Level (Cambridge / Edexcel)", "o level": "O-Level (Cambridge / Edexcel)",
  "a-level": "A-Level (Cambridge / Edexcel)", "a level": "A-Level (Cambridge / Edexcel)",
  "university": "University / Degree", "university level": "University / Degree",
};

const key = (value: string) => value.toLowerCase().replace(/[()/]/g, " ").replace(/\s+/g, " ").trim();

/** Converts known historic labels without silently accepting unknown values. */
export function normalizeEducationLevel(value: unknown): string {
  const text = String(value || "").trim();
  if (!text) return text;
  const canonical = EDUCATION_LEVELS.find((item) => key(item) === key(text));
  return canonical || aliases[key(text)] || text;
}

export function normalizeEducationLevels(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(normalizeEducationLevel).filter(Boolean))];
}
