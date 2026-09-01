import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL } from "@/lib/site";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Terms & Conditions</h1>
        <p style={{ color: '#9ca3af', marginTop: '0.75rem' }}>Last updated: January 2026</p>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { title: "1. Acceptance of Terms", content: "By accessing or using TUTORERA®, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform." },
            { title: "2. Platform Use", content: "TUTORERA® is a marketplace connecting students with tutors. We do not directly provide tutoring services. All tutoring relationships are between the student and tutor." },
            { title: "3. User Accounts", content: "You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration." },
            { title: "4. Tutor Verification", content: "All tutors must submit valid CNIC and educational credentials. TUTORERA® reserves the right to reject or remove any tutor profile." },
            { title: "5. Payments", content: "All payments are processed through TUTORERA®. Students currently pay the agreed tutoring amount with no marketplace service fee. Tutors pay a 20% marketplace fee after earning through a paid booking, plus applicable tax calculated on that fee. Every booking stores the fee configuration disclosed at acceptance." },
            { title: "6. Contact Information", content: "Sharing personal contact details (phone, WhatsApp, email) in chat is prohibited to ensure platform safety and quality." },
            { title: "7. Termination", content: "TUTORERA® reserves the right to suspend or terminate any account that violates these terms." },
            { title: "8. Merchant and Contact Details", content: `TUTORERA by MENTISERA is operated by ${LEGAL_OPERATOR}. Business address: ${BUSINESS_ADDRESS}. For questions about these terms, email ${SUPPORT_EMAIL}.` },
          ].map(section => (
            <div key={section.title}>
              <h2 style={{ fontWeight: '700', color: C.primary, fontSize: '1.1rem', marginBottom: '0.75rem' }}>{section.title}</h2>
              <p style={{ color: C.gray500, lineHeight: '1.75', fontSize: '0.95rem' }}>{section.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
