import Link from "next/link";
import { Search, UserCheck, MessageSquare, Star, Shield, CreditCard } from "lucide-react";
import { GST_EFFECTIVE_PERCENT, GST_ON_PLATFORM_FEE_PERCENT, PLATFORM_FEE_PERCENT, TOTAL_FEE_PERCENT } from "@/lib/site";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>

      {/* Hero */}
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
          How TUTORERA® Works
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto' }}>
          Simple, transparent, and structured — from search to first session.
        </p>
      </section>

      {/* For Students */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ backgroundColor: C.accentLight, color: C.accent, fontSize: '0.8rem', fontWeight: '700', padding: '0.3rem 1rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Students & Parents</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, marginTop: '1rem' }}>Find Your Perfect Tutor</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { step: "1", icon: <Search size={24} color={C.accent} />, title: "Search", desc: "Search tutors by subject, level, city, budget, and teaching mode. Use filters to narrow down to exactly what you need." },
              { step: "2", icon: <UserCheck size={24} color={C.accent} />, title: "Compare", desc: "Review tutor profiles including qualifications, experience, reviews, availability, and hourly rate." },
              { step: "3", icon: <MessageSquare size={24} color={C.accent} />, title: "Post a Request", desc: "Post your requirements and proposed budget. Verified tutors can accept it or send another offer." },
              { step: "4", icon: <CreditCard size={24} color={C.accent} />, title: "Compare, Agree & Pay", desc: "Compare tutor offers, negotiate if needed, accept an agreed rate, and complete payment." },
              { step: "5", icon: <Star size={24} color={C.accent} />, title: "Learn & Review", desc: "Attend sessions and leave a review after completion to help other students." },
            ].map((item, idx) => (
              <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: C.primary, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontWeight: '700', color: C.primary, marginBottom: '0.4rem' }}>{item.title}</h3>
                  <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.65' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '2px', backgroundColor: C.gray50 }} />

      {/* For Tutors */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.8rem', fontWeight: '700', padding: '0.3rem 1rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Tutors</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, marginTop: '1rem' }}>Start Teaching on TUTORERA®</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { step: "1", title: "Create Account", desc: "Sign up as a tutor and complete your 5-step onboarding including personal info, qualifications, and teaching preferences." },
              { step: "2", title: "Submit Verification", desc: "Upload your CNIC and degree certificate. Our team reviews and approves within 24-48 hours." },
              { step: "3", title: "Browse Requests", desc: "Browse open tuition requests from students. Filter by subject, level, city, and budget." },
              { step: "4", title: "Send Offers", desc: "Accept the proposed budget or send a transparent counter-offer with your availability and message." },
              { step: "5", title: "Teach & Earn", desc: `Once an offer is accepted and paid, start teaching. Tutors pay ${PLATFORM_FEE_PERCENT}% plus ${GST_EFFECTIVE_PERCENT}% effective tax on that fee.` },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#16a34a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontWeight: '700', color: C.primary, marginBottom: '0.4rem' }}>{item.title}</h3>
                  <p style={{ color: C.gray500, fontSize: '0.875rem', lineHeight: '1.65' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Fee */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, marginBottom: '1rem' }}>Platform Fees</h2>
          <p style={{ color: C.gray500, marginBottom: '2rem' }}>Simple and transparent pricing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
                { label: "Platform Fee", value: `${PLATFORM_FEE_PERCENT}%`, color: '#d97706', textColor: C.accent, desc: `TUTORERA® charges a ${PLATFORM_FEE_PERCENT}% fee on each booking to cover operational costs and platform maintenance.` },
                { label: `GST (${GST_ON_PLATFORM_FEE_PERCENT}% of ${PLATFORM_FEE_PERCENT}%)`, value: `${GST_EFFECTIVE_PERCENT}%`, color: '#d97706', textColor: 'white', desc: `As per Pakistani tax regulations, ${GST_ON_PLATFORM_FEE_PERCENT}% GST is applied on the platform fee.` },
                { label: "Total", value: `${TOTAL_FEE_PERCENT}%`, color: '#92400e', bold: true, textColor: 'white', desc: `The total fee deducted from tutor earnings is ${TOTAL_FEE_PERCENT}% (${PLATFORM_FEE_PERCENT}% platform fee + ${GST_EFFECTIVE_PERCENT}% GST).` },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: item.color, borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: item.textColor, marginBottom: '0.5rem' }}>{item.value}</p>
                <p style={{ fontWeight: '700', color: C.primary, fontSize: '1rem', marginBottom: '0.4rem' }}>{item.label}</p>
                <p style={{ color: C.gray500, fontSize: '0.8rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '1.5rem' }}>Includes 15% GST as per Pakistani tax regulations.</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: C.primary, textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Ready to Get Started?</h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ backgroundColor: C.accent, color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none' }}>Create Account</Link>
          <Link href="/tutors" style={{ border: '1.5px solid white', color: 'white', padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none' }}>Browse Tutors</Link>
        </div>
      </section>
    </div>
  );
}
