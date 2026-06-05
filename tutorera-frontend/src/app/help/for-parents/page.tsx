// for-parents
import Link from "next/link";
const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };
export default function ForParentsPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Guide for Parents & Students</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { title: "Step 1 — Create an Account", desc: "Sign up as a student and complete your 3-step onboarding with your personal info, current level, and subject preferences." },
            { title: "Step 2 — Browse Tutors", desc: "Use our search and filter to find tutors by subject, level, city, budget, and teaching mode." },
            { title: "Step 3 — Post a Request", desc: "Post a tuition request describing what you need. Verified tutors will place bids with their rates." },
            { title: "Step 4 — Accept a Bid", desc: "Review bids and accept the best one. A booking will be created automatically." },
            { title: "Step 5 — Pay & Start Learning", desc: "Transfer payment to TUTORERA®'s bank account. Once confirmed, your sessions begin." },
          ].map(item => (
            <div key={item.title} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: '700', color: C.primary, marginBottom: '0.4rem', fontSize: '1rem' }}>{item.title}</h2>
              <p style={{ color: C.gray500, fontSize: '0.9rem', lineHeight: '1.65' }}>{item.desc}</p>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/register" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}