const C = { primary: '#1a1a2e', gray500: '#6b7280', gray50: '#f9fafb' };
export default function CancellationPolicyPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Cancellation Policy</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { title: "Cancellation by Student", content: "Students may cancel a booking before the first session. Refund eligibility depends on timing — cancellations made 24+ hours in advance are eligible for a full refund minus platform fee." },
            { title: "Cancellation by Tutor", content: "Tutors must notify students and TUTORERA® at least 24 hours before a scheduled session. Repeated cancellations may result in account suspension." },
            { title: "No-Show Policy", content: "If a tutor fails to show up without prior notice, the student is entitled to a full refund." },
            { title: "Refund Processing", content: "Approved refunds are processed within 5-7 business days to the original payment method." },
            { title: "Disputes", content: "For payment or cancellation disputes, contact support@tutorera.pk with your booking details." },
          ].map(section => (
            <div key={section.title} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.5rem' }}>{section.title}</h2>
              <p style={{ color: C.gray500, lineHeight: '1.7', fontSize: '0.9rem' }}>{section.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}