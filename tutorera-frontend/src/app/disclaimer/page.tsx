import { UI_COLORS } from "@/lib/brand";
const C = UI_COLORS;
export default function DisclaimerPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Disclaimer</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: C.gray500, lineHeight: '1.75', fontSize: '0.95rem' }}>
          <p>TUTORERA® is a marketplace platform that connects students with independent tutors. We do not directly provide tutoring services.</p>
          <p>While we verify tutor credentials, we cannot guarantee the accuracy of all information provided by tutors. Users are advised to exercise due diligence.</p>
          <p>TUTORERA® is not responsible for the quality of tutoring sessions, disputes between students and tutors, or any outcomes resulting from tutoring relationships formed on the platform.</p>
          <p>All content on this platform is for informational purposes. MENTISERA (SMC-Private) Limited reserves the right to modify or discontinue services at any time.</p>
        </div>
      </section>
    </div>
  );
}