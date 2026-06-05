import Link from "next/link";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

const subjectCategories = [
  {
    category: "Sciences",
    color: "#eff6ff",
    textColor: "#2563eb",
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
    textColor: "#e94560",
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
          Find expert tutors across all major subjects taught in Pakistan.
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
                    <Link key={subject} href={`/tutors?subject=${subject}`}
                      style={{ backgroundColor: C.gray50, color: C.primary, fontSize: '0.875rem', padding: '0.4rem 0.875rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '500', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = cat.color; e.currentTarget.style.color = cat.textColor; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.gray50; e.currentTarget.style.color = C.primary; }}>
                      {subject}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ color: C.gray500, marginBottom: '1.5rem' }}>Can't find your subject? Post a request and tutors will reach out.</p>
            <Link href="/register" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              Post a Tuition Request
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}