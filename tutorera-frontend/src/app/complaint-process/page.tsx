import { UI_COLORS } from "@/lib/brand";
import Link from "next/link";
const C = UI_COLORS;
export default function ComplaintProcessPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Complaint Process</h1>
      </section>
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ color: C.gray500, marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.75' }}>
            We take all complaints seriously. Here's how to raise a complaint and what to expect.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {[
              { step: "1", title: "Submit Your Complaint", desc: "Use our Contact form or email hello@mentisera.pk with full details of your complaint including booking ID if applicable." },
              { step: "2", title: "Acknowledgement", desc: "We will acknowledge your complaint within 24 hours and assign it a reference number." },
              { step: "3", title: "Investigation", desc: "Our team will investigate within 3-5 business days, reviewing chat history, booking records, and both parties' statements." },
              { step: "4", title: "Resolution", desc: "We will communicate the outcome and any actions taken. This may include refunds, warnings, or account suspension." },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '1rem', backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: C.primary, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontWeight: '700', color: C.primary, marginBottom: '0.3rem', fontSize: '0.95rem' }}>{item.title}</h3>
                  <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/contact" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              Submit a Complaint
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
