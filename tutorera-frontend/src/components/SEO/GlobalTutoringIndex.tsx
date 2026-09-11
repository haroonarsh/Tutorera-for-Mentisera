import React from 'react';

export default function GlobalTutoringIndex() {
  return (
    <section style={{ maxWidth: 1120, margin: '4rem auto', padding: '2rem 1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#021550', marginBottom: '0.5rem' }}>
          TUTORERA Global Tutoring Index
        </h2>
        <p style={{ color: '#475569', maxWidth: 800, margin: '0 auto' }}>
          Live marketplace statistics, liquidity metrics, and verification data powering the global two-sided tutoring marketplace.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', textAlign: 'left', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#021550', color: 'white' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Marketplace Metric</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Current Value</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem', fontWeight: 600, color: '#0329b2' }}>Total Verified Tutors</td>
              <td style={{ padding: '1rem', fontWeight: 700 }}>1,200+</td>
              <td style={{ padding: '1rem', color: '#475569' }}>Educators who have passed rigorous identity and credential verification.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '1rem', fontWeight: 600, color: '#0329b2' }}>Active Tuition Requests</td>
              <td style={{ padding: '1rem', fontWeight: 700 }}>500+</td>
              <td style={{ padding: '1rem', color: '#475569' }}>Open requirements posted by students seeking tutor offers.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem', fontWeight: 600, color: '#0329b2' }}>Top Countries by Supply</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>Pakistan, UAE, UK, Saudi Arabia, Oman</td>
              <td style={{ padding: '1rem', color: '#475569' }}>Primary operational regions with localized tutor liquidity.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '1rem', fontWeight: 600, color: '#0329b2' }}>Top Global Subjects</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>Mathematics, Physics, Chemistry, English, Computer Science</td>
              <td style={{ padding: '1rem', color: '#475569' }}>Highest demand academic and curriculum-specific subjects.</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem', fontWeight: 600, color: '#0329b2' }}>Average Acceptance Rate</td>
              <td style={{ padding: '1rem', fontWeight: 700 }}>94%</td>
              <td style={{ padding: '1rem', color: '#475569' }}>Rate at which students successfully accept an offer and book a session.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
