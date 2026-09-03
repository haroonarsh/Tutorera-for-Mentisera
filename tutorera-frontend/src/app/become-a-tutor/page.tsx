import { UI_COLORS } from "@/lib/brand";
import Link from "next/link";
import { CheckCircle, Star, Users, Clock, Shield, BookOpen, ArrowRight } from "lucide-react";
import { formatPKR } from "@/lib/site";

const C = UI_COLORS;

export default function BecomeTutorPage() {
  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(37,99,235,0.2)', color: '#93c5fd', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            <Star size={14} /> Join 500+ Verified Tutors
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '800', color: 'white', lineHeight: '1.2', marginBottom: '1.25rem' }}>
            Teach Smarter with<br />
            <span style={{ color: '#60a5fa' }}>TUTORERA®</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: '1.75' }}>
            Reach serious students across Pakistan. Build your tutoring career on a structured, professional platform — without chasing leads.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register?role=tutor"
              style={{ backgroundColor: C.accent, color: 'white', padding: '0.9rem 2rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="/tutors"
              style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.9rem 2rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '1rem', textDecoration: 'none' }}>
              See Tutor Profiles
            </Link>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Why Teach on TUTORERA®?</h2>
            <p style={{ color: C.gray500 }}>Everything you need to grow your tutoring career.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <Users size={26} color={C.accent} />, title: "Access Serious Students", desc: "Connect with motivated students and parents who are actively searching for tutors — no cold outreach needed." },
              { icon: <Clock size={26} color={C.accent} />, title: "Teach on Your Schedule", desc: "Set your own availability. Teach part-time or full-time — you're in complete control of your calendar." },
              { icon: <Shield size={26} color={C.accent} />, title: "Verified & Trusted Badge", desc: "Get a verified badge after credential review. Stand out from unverified tutors and build trust with parents." },
              { icon: <Star size={26} color={C.accent} />, title: "Build Your Reputation", desc: "Collect reviews from students after each session. A strong profile attracts more bookings automatically." },
              { icon: <BookOpen size={26} color={C.accent} />, title: "Professional Platform", desc: "No WhatsApp groups or informal arrangements. A clean, professional system handles everything for you." },
              { icon: <ArrowRight size={26} color={C.accent} />, title: "Grow Your Income", desc: `Set your own hourly rate. Active tutors can earn ${formatPKR(5000)}–${formatPKR(15000)} per day from multiple students.` },
            ].map(item => (
              <div key={item.title} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: C.accentLight, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.65' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>How It Works</h2>
          <p style={{ color: C.gray500, marginBottom: '3.5rem' }}>Get started in 3 simple steps.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            {[
              { step: "1", title: "Create Your Profile", desc: "Sign up and fill in your subjects, levels, hourly rate, bio, and availability." },
              { step: "2", title: "Get Verified", desc: "Submit your CNIC and degree. Our team reviews and approves within 24 hours." },
              { step: "3", title: "Start Teaching", desc: "Receive booking requests, accept sessions, and start earning." },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: C.primary, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800' }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary }}>{item.title}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Who Can Join?</h2>
            <p style={{ color: C.gray500 }}>We welcome qualified educators across Pakistan.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '700', color: C.primary, marginBottom: '1.25rem', fontSize: '1rem' }}>✅ Requirements</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  "Bachelor's degree or higher",
                  "Valid CNIC (Pakistani citizen)",
                  "Minimum 1 year teaching experience",
                  "Reliable internet connection",
                  "Passion for teaching",
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.gray500, fontSize: '0.875rem' }}>
                    <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '700', color: C.primary, marginBottom: '1.25rem', fontSize: '1rem' }}>📚 Subjects We Need</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  "Mathematics & Statistics",
                  "Physics, Chemistry, Biology",
                  "English & Urdu Language",
                  "Computer Science & IT",
                  "Economics & Accounts",
                  "Entry Test Preparation",
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.gray500, fontSize: '0.875rem' }}>
                    <ArrowRight size={14} color={C.accent} style={{ flexShrink: 0 }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: '3rem' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { q: "Is it free to join as a tutor?", a: "Yes, creating a tutor profile on TUTORERA® is completely free. We only charge a small platform fee on successful bookings." },
              { q: "How long does verification take?", a: "Our team reviews tutor applications within 24–48 hours. You'll receive an email notification once approved." },
              { q: "Can I set my own hourly rate?", a: `Absolutely. You set your own price. We recommend ${formatPKR(1500)}–${formatPKR(5000)} per hour depending on your level and subject.` },
              { q: "Do I need to be in a specific city?", a: "No. TUTORERA® supports online tutoring across all of Pakistan. You can also offer in-person sessions in your city." },
            ].map(item => (
              <div key={item.q} style={{ backgroundColor: C.gray50, borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.6rem' }}>{item.q}</h3>
                <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.65' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.primary, textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
            Ready to Start Teaching?
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Join Pakistan's fastest growing tutoring platform today.
          </p>
          <Link href="/register?role=tutor"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: C.accent, color: 'white', padding: '1rem 2.5rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '1.05rem', textDecoration: 'none' }}>
            Create Tutor Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}
