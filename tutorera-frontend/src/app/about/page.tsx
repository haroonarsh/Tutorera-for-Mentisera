import { UI_COLORS } from "@/lib/brand";
import Link from "next/link";
import { BookOpen, Users, Shield, Target, Heart } from "lucide-react";
import type { Metadata } from "next";
import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About TUTORERA®",
  description: "TUTORERA® is Pakistan's trusted tutoring marketplace, operated by MENTISERA (SMC-Private) Limited.",
  alternates: { canonical: "/about" },
};

const C = UI_COLORS;

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>

      {/* Hero */}
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <BookOpen size={36} color="#60a5fa" />
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>TUTORERA<span style={{ color: '#C81B7F' }}>®</span></span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1.25rem', lineHeight: '1.2' }}>
            Pakistan's Trusted Tutoring Marketplace
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: '1.75', maxWidth: '600px', margin: '0 auto' }}>
            TUTORERA® is a platform built to bring transparency, safety, and structure to the way students and parents find tutors in Pakistan.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '1rem' }}>Our Mission</h2>
          <p style={{ color: C.gray500, fontSize: '1.05rem', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto 3rem' }}>
            To replace informal, unverified, and risky tutoring arrangements with a clear, structured, and trustworthy marketplace — built specifically for Pakistan's education system.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <Target size={28} color={C.accent} />, title: "Clear", desc: "Search by subject, level, budget, and schedule — no guesswork." },
              { icon: <Shield size={28} color={C.accent} />, title: "Safe", desc: "All tutors are verified with CNIC and degree checks before approval." },
              { icon: <Heart size={28} color={C.accent} />, title: "Trusted", desc: "Student reviews and ratings build a transparent reputation system." },
            ].map(item => (
              <div key={item.title} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/team" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, color: 'white', padding: '0.85rem 1.5rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none' }}>
              Meet the Team
            </Link>
          </div>
        </div>
      </section>

      {/* Marketplace model */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.75rem' }}>Our Marketplace Model</h2>
            <p style={{ color: C.gray500, fontSize: '1rem', lineHeight: 1.75, maxWidth: 760, margin: '0 auto' }}>
              TUTORERA by MENTISERA is a student-led tutoring marketplace. Students or parents post a requirement, may state a preferred budget in PKR, receive tutor offers, compare profiles and prices, and choose the tutor who best fits their needs.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              "Student posts requirement",
              "Tutors submit offers",
              "Student compares fit and price",
              "Final PKR rate is agreed",
              "Booking is created",
              "Payment follows the confirmed booking",
              "Tutor delivers the session",
              "Student can review or request support",
            ].map((step, index) => (
              <div key={step} style={{ backgroundColor: C.gray50, border: '1px solid #e5e7eb', borderRadius: '0.875rem', padding: '1.25rem' }}>
                <p style={{ color: C.accent, fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.35rem' }}>STEP {String(index + 1).padStart(2, "0")}</p>
                <p style={{ color: C.primary, fontWeight: 750, lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
          <p style={{ color: C.gray500, fontSize: '0.95rem', lineHeight: 1.75, marginTop: '1.5rem', textAlign: 'center' }}>
            TUTORERA provides marketplace technology, student request posting, tutor matching, tutor offer comparison, price confirmation, booking management, scheduling, communication, payment facilitation, transaction records, session management, tutor reviews, customer support, refund and dispute administration, and platform governance. Tutors provide the actual tutoring service as independent providers.
          </p>
          <p style={{ color: C.gray500, fontSize: '0.95rem', lineHeight: 1.75, marginTop: '0.5rem', textAlign: 'center' }}>
            TUTORERA is not affiliated with, endorsed by, or certified by any ride-hailing or third-party marketplace brand. The model similarity is limited to the general reverse-marketplace idea where customers post demand and providers respond with offers.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '1.5rem', textAlign: 'center' }}>Our Story</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: C.gray500, fontSize: '1rem', lineHeight: '1.8' }}>
            <p>For decades, finding a tutor in Pakistan meant relying on word-of-mouth, Facebook groups, or random agents — with no way to verify credentials, compare options, or ensure safety.</p>
            <p>TUTORERA® was built to change that. We created a structured marketplace where students and parents can search for tutors by subject, level, location, and budget — and where every tutor on the platform has been manually verified.</p>
            <p>We are operated by <strong style={{ color: C.primary }}>{LEGAL_OPERATOR}</strong>, an education-focused technology company committed to building transparent, platform-based learning solutions for Pakistan.</p>
            <p><strong style={{ color: C.primary }}>Business address:</strong> {BUSINESS_ADDRESS}</p>
            <p><strong style={{ color: C.primary }}>Official email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> · <strong style={{ color: C.primary }}>Phone / WhatsApp:</strong> {SUPPORT_PHONE}</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Behind TUTORERA®</h2>
          <p style={{ color: C.gray500, marginBottom: '3rem' }}>Built by a team passionate about education in Pakistan.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { name: "MENTISERA Team", role: "Product & Engineering" },
              { name: "Education Advisors", role: "Curriculum & Verification" },
              { name: "Support Team", role: "Student & Tutor Success" },
            ].map(member => (
              <div key={member.name} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: C.accentLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Users size={24} color={C.accent} />
                </div>
                <p style={{ fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>{member.name}</p>
                <p style={{ color: C.gray500, fontSize: '0.875rem' }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '1rem' }}>Join TUTORERA® Today</h2>
        <p style={{ color: C.gray500, marginBottom: '2rem' }}>Whether you're a student, parent, or tutor — there's a place for you here.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tutors" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none' }}>Find a Tutor</Link>
          <Link href="/become-a-tutor" style={{ border: `1.5px solid ${C.primary}`, color: C.primary, padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none' }}>Become a Tutor</Link>
        </div>
      </section>
    </div>
  );
}
