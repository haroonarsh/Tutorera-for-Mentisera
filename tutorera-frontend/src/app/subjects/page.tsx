"use client";
import { UI_COLORS } from "@/lib/brand";
import { formatPKR } from "@/lib/site";
import { slugify } from "@/lib/tutor-directory";
import Link from "next/link";
import { subjectCatalogue } from "@/lib/subject-catalogue";

const C = UI_COLORS;

const subjectCategories = [
  {
    category: "Sciences",
    color: "#EEF5FF",
    textColor: "#0329B2",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Statistics"],
  },
  {
    category: "Languages",
    color: "#f0fdf4",
    textColor: "#16a34a",
    subjects: ["English Language", "Urdu Language", "Arabic Language", "Persian"],
  },
  {
    category: "Commerce",
    color: "#fffbeb",
    textColor: "#d97706",
    subjects: ["Economics", "Accounting", "Business Studies", "Commerce"],
  },
  {
    category: "Humanities",
    color: "#fdf4ff",
    textColor: "#7c3aed",
    subjects: ["History", "Geography", "Islamiyat", "Pakistan Studies", "Civics"],
  },
  {
    category: "Test Preparation",
    color: "#fff1f2",
    textColor: "#C81B7F",
    subjects: ["MDCAT", "ECAT", "SAT", "IELTS", "Entry Tests"],
  },
  {
    category: "Technology",
    color: "#f0fdf4",
    textColor: "#16a34a",
    subjects: ["Programming", "Web Development", "Data Science", "Graphic Design"],
  },
];

export default function SubjectsPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
          Subjects We Cover
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
          Find expert tutors across major subjects taught in Pakistan. Tutor rates are shown in PKR before booking.
        </p>
      </section>

      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {subjectCategories.map(cat => (
              <div key={cat.category} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'inline-block', backgroundColor: cat.color, color: cat.textColor, fontSize: '0.8rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '999px', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cat.category}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {cat.subjects.map(subject => (
                    <Link key={subject} href={`/tutors/subject/${slugify(subject.replace(" Language", ""))}`}
                      style={{ backgroundColor: C.gray50, color: C.primary, fontSize: '0.875rem', padding: '0.4rem 0.875rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '500', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = cat.color; e.currentTarget.style.color = cat.textColor; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.gray50; e.currentTarget.style.color = C.primary; }}>
                      {subject}
                    </Link>
                  ))}
                </div>
                <p style={{ color: C.gray500, fontSize: '0.85rem', lineHeight: 1.65, marginTop: '1rem' }}>
                  Pricing varies by tutor, level, mode, and availability. Final agreed rates are displayed in PKR before checkout; example available tutor rates may start from {formatPKR(1500, "hour")}.
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ color: C.gray500, marginBottom: '1.5rem' }}>Can't find your subject? Post a request and tutors will reach out.</p>
            <Link href="/register" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              Post a Tuition Request
            </Link>
            <Link href="/services" style={{ marginLeft: '0.75rem', border: `1px solid ${C.accent}`, color: C.accent, padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              View Tutoring Services
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="curriculum-heading" style={{ padding: "3rem 1.5rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 id="curriculum-heading" style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>Subjects by curriculum</h2>
          <p style={{ marginBottom: "1.5rem" }}>Explore FBISE, Cambridge and Pearson Edexcel subjects by qualification. Tutor availability varies.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {subjectCatalogue.map(group => (
              <article key={group.curriculum + group.qualification} style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: 12, background: "white" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>{group.curriculum} — {group.qualification}</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {group.subjects.map(subject => (
                    <li key={subject.code ?? subject.name} style={{ padding: "0.4rem 0" }}>
                      <Link href={`/tutors?subject=${encodeURIComponent(subject.name)}`} style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                        {subject.name}{subject.code ? ` (${subject.code})` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>Tutoring support does not imply accreditation or examination-board affiliation.</p>
        </div>
      </section>
    </div>
  );
}
