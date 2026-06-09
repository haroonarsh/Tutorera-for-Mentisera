import Link from "next/link";
import { BookOpen, Users, Shield, Target, Heart, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About TUTORERA®",
  description: "TUTORERA® is Pakistan's trusted tutoring marketplace, operated by MENTISERA (SMC-Private) Limited.",
};

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>

      {/* Hero */}
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <BookOpen size={36} color="#60a5fa" />
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>TUTORERA<span style={{ color: '#e94560' }}>®</span></span>
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
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '1.5rem', textAlign: 'center' }}>Our Story</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: C.gray500, fontSize: '1rem', lineHeight: '1.8' }}>
            <p>For decades, finding a tutor in Pakistan meant relying on word-of-mouth, Facebook groups, or random agents — with no way to verify credentials, compare options, or ensure safety.</p>
            <p>TUTORERA® was built to change that. We created a structured marketplace where students and parents can search for tutors by subject, level, location, and budget — and where every tutor on the platform has been manually verified.</p>
            <p>We are operated by <strong style={{ color: C.primary }}>MENTISERA (SMC-Private) Limited</strong>, an education-focused technology company committed to building transparent, platform-based learning solutions for Pakistan.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: C.primary }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { value: "500+", label: "Verified Tutors" },
              { value: "50+", label: "Subjects Covered" },
              { value: "10+", label: "Cities Covered" },
              { value: "1000+", label: "Students Helped" },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '0.4rem' }}>{stat.value}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{stat.label}</p>
              </div>
            ))}
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