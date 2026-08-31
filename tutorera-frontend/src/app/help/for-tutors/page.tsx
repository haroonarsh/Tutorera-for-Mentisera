// for-tutors
import Link from "next/link";
const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };
export default function ForTutorsPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Guide for Tutors</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { title: "Step 1 — Create Your Account", desc: "Sign up as a tutor and complete the 5-step onboarding: personal info, education, experience, profile setup, and document upload." },
            { title: "Step 2 — Get Verified", desc: "Submit your CNIC and degree. Our team reviews within 24-48 hours and notifies you by email." },
            { title: "Step 3 — Browse Requests", desc: "Go to your dashboard to browse open tuition requests from students across Pakistan." },
            { title: "Step 4 — Send Offers", desc: "Accept the proposed budget or send an alternative offer with your availability and relevant experience." },
            { title: "Step 5 — Start Teaching", desc: "When a student accepts your offer and completes payment, the booking becomes active." },
          ].map(item => (
            <div key={item.title} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: '700', color: C.primary, marginBottom: '0.4rem', fontSize: '1rem' }}>{item.title}</h2>
              <p style={{ color: C.gray500, fontSize: '0.9rem', lineHeight: '1.65' }}>{item.desc}</p>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/become-a-tutor" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              Become a Tutor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
