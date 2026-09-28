import React from 'react';
import Link from 'next/link';

export default function GlobalTutoringIndex() {
  return (
    <section style={{ maxWidth: 1120, margin: '4rem auto', padding: '2rem 1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#021550', marginBottom: '0.5rem' }}>
          TUTORERA Global Tutoring Index
        </h2>
        <p style={{ color: '#475569', maxWidth: 800, margin: '0 auto' }}>
          Market-rate research is published only when there is enough anonymised, country- and currency-specific data to report it responsibly.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#475569', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>The index never combines currencies or presents sample data as a market fact. Explore the methodology, selected market, observation period, and any available anonymised benchmarks on the research page.</p>
          <Link href="/research/tutoring-index" style={{ display: 'inline-block', marginTop: '1rem', color: '#0329b2', fontWeight: 700 }}>Explore the Tutoring Index</Link>
        </div>
      </div>
    </section>
  );
}
