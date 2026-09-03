import Link from "next/link";
const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };
export default function SafetyPolicyPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Safety Policy</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { title: "Tutor Verification", content: "All tutors must submit valid CNIC and educational certificates before being approved. Our team manually reviews every application." },
            { title: "Contact Privacy", content: "Phone numbers, WhatsApp, and email addresses are automatically filtered from chat messages to protect both students and tutors." },
            { title: "In-Person Sessions", content: "For in-person and home tuition, tutors must complete the required police verification before becoming eligible. Sessions involving minors should normally take place in appropriate common or observable study areas, with a parent or guardian present or reasonably accessible." },
            { title: "Reporting", content: "Users can report inappropriate behaviour through our contact form. All reports are reviewed within 24 hours." },
            { title: "Account Suspension", content: "Any user found violating our safety policies will have their account suspended immediately." },
          ].map(section => (
            <div key={section.title} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.5rem' }}>🛡️ {section.title}</h2>
              <p style={{ color: C.gray500, lineHeight: '1.7', fontSize: '0.9rem' }}>{section.content}</p>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <Link href="/contact" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>Report an Issue</Link>
            <Link href="/in-person-home-tuition-terms" style={{ marginLeft: '.75rem', backgroundColor: 'white', color: C.accent, padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block', border: '1px solid #bfdbfe' }}>Home Tuition Terms</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
