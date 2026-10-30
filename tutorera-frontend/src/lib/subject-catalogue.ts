import { MASTER_SUBJECTS } from "@/lib/location";

export type SubjectEntry = { name: string; slug: string; category?: string };
export type SubjectCatalogue = { subjects: SubjectEntry[]; live: boolean };

export function subjectSlug(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";

/** Only use the bundled reference list if the live read-only endpoint is unavailable. */
export async function getSubjectCatalogue(): Promise<SubjectCatalogue> {
  try {
    const response = await fetch(`${API_URL}/geo/subjects`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error("Subject catalogue unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("subjects" in data) || !Array.isArray(data.subjects)) throw new Error("Invalid subject catalogue");
    const subjects = data.subjects.filter((entry: unknown): entry is SubjectEntry => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as Record<string, unknown>;
      return typeof item.name === "string" && item.name.trim().length > 0 && typeof item.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug);
    });
    return { subjects, live: true };
  } catch {
    return { subjects: MASTER_SUBJECTS.map((name) => ({ name, slug: name === "Quran & Arabic" ? "quran-arabic" : subjectSlug(name) })), live: false };
  }
}

export const SUBJECT_GUIDES: Record<string, { summary: string; topics: string[] }> = {
  Mathematics: { summary: "Build confidence with numerical reasoning and problem solving at your chosen level.", topics: ["Algebra and functions", "Geometry and measurement", "Statistics and probability"] },
  Physics: { summary: "Explore physical principles through explanations, calculations and worked problems.", topics: ["Motion and forces", "Energy and waves", "Electricity and magnetism"] },
  Chemistry: { summary: "Study chemical concepts and practise applying them to questions and experiments.", topics: ["Atomic structure and bonding", "Chemical reactions", "Organic chemistry"] },
  Biology: { summary: "Understand living systems and connect biological concepts to exam questions.", topics: ["Cells and organisms", "Genetics and inheritance", "Ecology and human biology"] },
  English: { summary: "Develop reading, writing and communication skills for your learning goals.", topics: ["Reading comprehension", "Writing and grammar", "Speaking and vocabulary"] },
  Urdu: { summary: "Practise Urdu language and literature with guidance suited to your level.", topics: ["Reading and comprehension", "Writing and grammar", "Literature and poetry"] },
  "Computer Science": { summary: "Learn how computers work and develop structured problem-solving skills.", topics: ["Algorithms and programming", "Data and systems", "Networks and computing concepts"] },
  Economics: { summary: "Explore how people, businesses and governments make economic decisions.", topics: ["Supply and demand", "Markets and policy", "Economic data and reasoning"] },
  Accounting: { summary: "Practise recording, interpreting and communicating financial information.", topics: ["Bookkeeping principles", "Financial statements", "Costing and analysis"] },
  "Business Studies": { summary: "Understand business decisions and apply concepts to real examples.", topics: ["Marketing and operations", "Finance and planning", "People and management"] },
  Islamiyat: { summary: "Study the concepts and texts relevant to your chosen Islamiyat syllabus.", topics: ["Core beliefs and practices", "Texts and interpretation", "History and ethics"] },
  "Pakistan Studies": { summary: "Explore Pakistan's history, geography and civic context at your chosen level.", topics: ["Historical developments", "Geography and resources", "Government and society"] },
  Statistics: { summary: "Learn to interpret data and apply statistical methods to problems.", topics: ["Describing data", "Probability", "Statistical inference"] },
  Sociology: { summary: "Examine society, institutions and the methods used to study them.", topics: ["Social structures", "Culture and identity", "Research methods"] },
  Psychology: { summary: "Explore behaviour and the research methods used in psychology.", topics: ["Cognition and development", "Behaviour and social influence", "Research methods"] },
  History: { summary: "Build historical understanding through evidence, context and critical analysis.", topics: ["Historical context", "Sources and evidence", "Structured arguments"] },
  Geography: { summary: "Study physical and human environments and learn to interpret geographical evidence.", topics: ["Physical environments", "People and places", "Maps and data"] },
  MDCAT: { summary: "Plan preparation for the medical entrance examination with focused subject practice.", topics: ["Science concepts", "Timed practice", "Reviewing mistakes"] },
  ECAT: { summary: "Prepare for engineering entrance assessments with a structured practice plan.", topics: ["Mathematics and science", "Problem-solving strategies", "Timed practice"] },
  SAT: { summary: "Prepare for SAT questions with a plan matched to your current skills.", topics: ["Reading and writing", "Mathematics", "Timed practice"] },
  IELTS: { summary: "Develop the language skills assessed in your chosen IELTS test.", topics: ["Listening and reading", "Writing tasks", "Speaking practice"] },
  "Quran & Arabic": { summary: "Arrange support in Quran studies or Arabic learning according to your goals.", topics: ["Reading practice", "Language foundations", "Learning goals and feedback"] },
  "General Science": { summary: "Build a foundation across the sciences through questions and practical examples.", topics: ["Living things", "Matter and materials", "Forces and energy"] },
};
