import Link from "next/link";
import { BookOpen } from "lucide-react";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

const levels = [
  { name: "Primary School", grades: "Grade 1–5", age: "Ages 5–10", desc: "Foundation subjects including English, Urdu, Mathematics, Science, and Islamiyat.", color: "#eff6ff", textColor: "#2563eb" },
  { name: "Middle School", grades: "Grade 6–8", age: "Ages 11–13", desc: "Core subjects with increasing complexity. Science, Math, Languages, and Social Studies.", color: "#f0fdf4", textColor: "#16a34a" },
  { name: "Matriculation", grades: "Grade 9–10", age: "Ages 14–15", desc: "Board exam preparation for all Pakistani education boards (Punjab, Federal, Sindh, KPK).", color: "#fffbeb", textColor: "#d97706" },
  { name: "O-Levels", grades: "Cambridge IGCSE", age: "Ages 14–16", desc: "Cambridge O-Level preparation across all subjects including Pure Math, Sciences, and Languages.", color: "#fdf4ff", textColor: "#7c3aed" },
  { name: "Intermediate / FSc", grades: "Grade 11–12", age: "Ages 16–17", desc: "Pre-medical, Pre-engineering, ICS, and FA preparation for all boards.", color: "#fff1f2", textColor: "#e94560" },
  { name: "A-Levels", grades: "Cambridge AS & A2", age: "Ages 16–18", desc: "Advanced Cambridge A-Level preparation for university entrance.", color: "#eff6ff", textColor: "#2563eb" },
  { name: "University Level", grades: "Bachelor's / Master's", age: "Ages 18+", desc: "University-level tutoring for engineering, medicine, business, CS, and more.", color: "#f0fdf4", textColor: "#16a34a" },
  { name: "Test Preparation", grades: "Entry Tests", age: "All Ages", desc: "MDCAT, ECAT, NTS, IELTS, SAT, and other competitive exam preparation.", color: "#fffbeb", textColor: "#d97706" },
];

function tutorHref(levelName: string) {
  const slugs: Record<string, string> = {
    "Primary School": "primary", "Middle School": "middle", Matriculation: "matric",
    "O-Levels": "o-level", "Intermediate / FSc": "intermediate", "A-Levels": "a-level",
    "University Level": "university",
  };
  return levelName === "Test Preparation" ? "/tutors/subject/mdcat" : `/tutors/level/${slugs[levelName]}`;
}

export default function LevelsPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
          Levels We Cover
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
          From primary school to university — find the right tutor for every stage of learning.
        </p>
      </section>

      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {levels.map(level => (
              <div key={level.name} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', backgroundColor: level.color, borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} color={level.textColor} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem' }}>{level.name}</h3>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{level.grades} · {level.age}</p>
                  </div>
                </div>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>{level.desc}</p>
                <Link href={tutorHref(level.name)}
                  style={{ display: 'inline-block', backgroundColor: level.color, color: level.textColor, fontSize: '0.8rem', fontWeight: '700', padding: '0.4rem 1rem', borderRadius: '999px', textDecoration: 'none' }}>
                  Find Tutors →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
