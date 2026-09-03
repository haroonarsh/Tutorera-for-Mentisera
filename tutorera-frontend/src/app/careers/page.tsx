import { UI_COLORS } from "@/lib/brand";
import Link from "next/link";
const C = UI_COLORS;
export default function CareersPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Careers at MENTISERA</h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>Join our team and help transform education in Pakistan.</p>
      </section>
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary, marginBottom: '1rem' }}>No Open Positions Right Now</h2>
          <p style={{ color: C.gray500, marginBottom: '2rem', lineHeight: '1.75' }}>
            We're a growing team at MENTISERA. While we don't have open positions right now, we're always looking for passionate people. Send your CV to <strong>careers@mentisera.pk</strong>
          </p>
          <Link href="/contact" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}