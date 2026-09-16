// Genuinely differentiated curriculum content for TUTORERA's highest-intent
// subject/level landing pages - Mathematics, Physics, O-Level, IGCSE, A-Level.
// Unlike the generic SeoTutorDirectory template (same 3 reworded FAQs on
// every page), this is real syllabus/exam-board detail specific to each
// topic, rendered as an additional content block above the tutor listing.

export interface CurriculumTopic {
  key: string;
  heading: string;
  intro: string;
  topics: string[];
  examBoards: string[];
  whoItsFor: string;
  whyTutoring: string;
  faq: { q: string; a: string }[];
}

export const CURRICULUM_CONTENT: Record<string, CurriculumTopic> = {
  mathematics: {
    key: "mathematics",
    heading: "Mathematics Tutoring",
    intro: "Mathematics tutoring on TUTORERA covers everything from foundational arithmetic through university-level calculus, matched to the exact syllabus a student is studying rather than a generic curriculum.",
    topics: ["Algebra & functions", "Geometry & trigonometry", "Calculus (differentiation & integration)", "Statistics & probability", "Number theory & sequences", "Mechanics (for combined Maths/Further Maths syllabi)"],
    examBoards: ["Cambridge (CIE) O-Level & IGCSE", "Cambridge & Edexcel A-Level", "Federal Board & Provincial Boards (Matric/Intermediate)", "IB Mathematics AA & AI", "SAT & university entrance mathematics"],
    whoItsFor: "Students preparing for board exams, O/A-Level or IGCSE Mathematics, standardized tests like SAT, or anyone who needs to rebuild fundamentals before tackling calculus or statistics.",
    whyTutoring: "A tutor who works through past papers and marking schemes with a student catches the specific mistakes a self-study video can't - method marks lost in algebra, misapplied formulas, or exam-technique issues under time pressure.",
    faq: [
      { q: "How do I know which Mathematics tutor matches my syllabus?", a: "Post your requirement with the exact board (Cambridge, Edexcel, Federal Board, IB, etc.) and level - tutors who teach that specific syllabus will respond with offers, so you're not screening generalist profiles yourself." },
      { q: "Can a Mathematics tutor help with exam technique, not just topics?", a: "Yes - most tutors on TUTORERA work through past papers and mark schemes, which is usually where students lose the most marks even when they understand the underlying topic." },
    ],
  },
  physics: {
    key: "physics",
    heading: "Physics Tutoring",
    intro: "Physics tutoring on TUTORERA spans conceptual foundations through applied problem-solving for board exams, O/A-Level, and entry tests like MDCAT and ECAT.",
    topics: ["Mechanics & motion", "Electricity & magnetism", "Waves & optics", "Thermodynamics", "Modern & nuclear physics", "Practical/numerical problem-solving"],
    examBoards: ["Cambridge (CIE) O-Level & IGCSE", "Cambridge & Edexcel A-Level", "Federal Board & Provincial Boards (Matric/Intermediate)", "IB Physics", "MDCAT & ECAT entry test preparation"],
    whoItsFor: "Students who find Physics's numerical problem-solving harder than its concepts (or vice versa), and anyone preparing for entry tests where Physics carries heavy weight.",
    whyTutoring: "Physics problems usually fail on setup, not arithmetic - picking the wrong formula, missing a unit conversion, or misreading a diagram. A tutor working live through numericals catches that immediately, which is hard to get from recorded lectures alone.",
    faq: [
      { q: "Is Physics tutoring useful for entry test preparation, not just school exams?", a: "Yes - Physics is typically one of the highest-weighted sections in MDCAT and ECAT, and tutors experienced with those specific test formats can focus on speed and formula recall rather than full syllabus depth." },
      { q: "Can I get a Physics tutor for numericals only, without full syllabus coverage?", a: "Yes - describe exactly what you need (e.g. \"numerical problem-solving practice for O-Level Physics\") in your tuition request, and tutors will tailor their offer accordingly." },
    ],
  },
};

export const LEVEL_CONTENT: Record<string, CurriculumTopic> = {
  "o-level": {
    key: "o-level",
    heading: "O-Level Tutoring",
    intro: "O-Level (Ordinary Level) is the Cambridge International and Edexcel qualification typically taken around age 14-16, forming the foundation before A-Level or an equivalent higher-secondary qualification.",
    topics: ["Mathematics & Additional Mathematics", "Sciences (Physics, Chemistry, Biology)", "English Language & Literature", "Business Studies, Economics & Accounting", "Computer Science", "Languages & Humanities"],
    examBoards: ["Cambridge International (CIE)", "Edexcel International GCSE (used interchangeably with O-Level in some markets)"],
    whoItsFor: "Students in international or O-Level-affiliated schools who need subject-specific support to meet Cambridge/Edexcel grading standards, which differ from local board marking schemes.",
    whyTutoring: "O-Level exams are structured and marked differently from local boards - past-paper familiarity and command-word technique (\"state\", \"explain\", \"calculate\") often matter as much as subject knowledge.",
    faq: [
      { q: "What's the difference between O-Level and IGCSE?", a: "Both are Cambridge/Edexcel international qualifications at the same level; IGCSE (International GCSE) is generally coursework-and-exam-flexible and offered more globally, while O-Level is a similar standard used predominantly in a smaller set of markets. Syllabus content for shared subjects is closely aligned." },
      { q: "Can one tutor cover multiple O-Level subjects?", a: "Some do, particularly across related sciences or humanities - specify all the subjects you need in your tuition request and compare offers from tutors who cover that combination." },
    ],
  },
  igcse: {
    key: "igcse",
    heading: "IGCSE Tutoring",
    intro: "IGCSE (International General Certificate of Secondary Education) is Cambridge and Edexcel's globally recognized qualification for students typically aged 14-16, widely used as the entry point into A-Level, IB, or other higher-secondary pathways.",
    topics: ["Mathematics & Additional Mathematics", "Combined & Co-ordinated Sciences", "English as a First/Second Language", "Global Perspectives & Humanities", "Business, Economics & ICT", "Foreign Languages"],
    examBoards: ["Cambridge International (CIE) IGCSE", "Edexcel International GCSE"],
    whoItsFor: "Students in international schools worldwide following the Cambridge or Edexcel IGCSE syllabus, including those transferring between countries mid-curriculum.",
    whyTutoring: "IGCSE grade boundaries and coursework/exam weighting vary by subject and exam session - a tutor familiar with the current syllabus version and recent past papers can flag exactly where marks are typically lost.",
    faq: [
      { q: "Do IGCSE tutors on TUTORERA teach both Cambridge and Edexcel syllabi?", a: "Coverage varies by tutor - specify which exam board your school follows in your tuition request so responding tutors are already aligned with your syllabus version." },
      { q: "Is IGCSE tutoring available online for students outside Pakistan?", a: "Yes - TUTORERA's marketplace is global, so IGCSE students anywhere can post a requirement and receive offers from tutors experienced with their specific curriculum, online." },
    ],
  },
  "a-level": {
    key: "a-level",
    heading: "A-Level Tutoring",
    intro: "A-Level (Advanced Level) is the Cambridge and Edexcel qualification typically taken after O-Level/IGCSE, forming the primary route into university admissions worldwide.",
    topics: ["Mathematics & Further Mathematics", "Physics, Chemistry & Biology", "Economics & Business", "Computer Science", "English Literature & Language", "Psychology, Sociology & Humanities"],
    examBoards: ["Cambridge International (CIE) A-Level", "Edexcel International A-Level"],
    whoItsFor: "Students preparing for university admissions who need depth in 3-4 subjects, often alongside standardized tests (SAT) or subject-specific entry requirements.",
    whyTutoring: "A-Level content moves faster and rewards exam-technique precision (structured essays, multi-step numericals, evaluation-style answers) more than earlier levels - a tutor who marks practice answers against the actual grade descriptors makes the biggest difference here.",
    faq: [
      { q: "Should I get an A-Level tutor for a subject I'm already doing well in?", a: "Often the highest-value use of A-Level tutoring is turning a B into an A - refining exam technique and addressing the specific mark-scheme habits that cap a grade, not just remedial support." },
      { q: "Can A-Level tutoring help with university admissions, not just exams?", a: "Some tutors also support personal statements, admissions test preparation (e.g. subject-specific entrance exams), and interview practice - mention this in your tuition request if it's part of what you need." },
    ],
  },
};
