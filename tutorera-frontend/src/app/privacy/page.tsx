import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL } from "@/lib/site";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280' };

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Privacy Policy</h1>
        <p style={{ color: '#9ca3af', marginTop: '0.75rem' }}>Last updated: January 2026</p>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { title: "Information We Collect", content: "We collect information you provide during registration including name, email, phone number, city, and educational documents for tutor verification." },
            { title: "How We Use Your Information", content: "Your information is used to operate the platform, verify tutors, process bookings, and communicate important updates about your account." },
            { title: "Data Security", content: "We implement industry-standard security measures to protect your personal information. Passwords are encrypted and sensitive documents are stored securely." },
            { title: "Sharing of Information", content: "We do not sell your personal information. Student and tutor contact details are kept private within the platform." },
            { title: "Cookies", content: "We use cookies to maintain your session and improve your experience on TUTORERA®." },
            { title: "Your Rights", content: `You may request access to, correction of, or deletion of your personal data by contacting us at ${SUPPORT_EMAIL}` },
            { title: "Business Controller and Contact", content: `The business controller and operating entity is ${LEGAL_OPERATOR}. Business address: ${BUSINESS_ADDRESS}. For privacy-related questions, contact ${SUPPORT_EMAIL}.` },
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
