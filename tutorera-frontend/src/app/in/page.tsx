import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Home, Laptop, MapPin, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site";

const IN_URL = `${SITE_URL}/in`;

const learningModes = [
  { href: "/in/delhi/home-tuition",   label: "Home Tuition",   desc: "Verified tutors teaching at your home address in Delhi, Mumbai, Bangalore, Chennai, Hyderabad or Kolkata.", icon: Home,   post: "/post-home-tuition-request?country=IN" },
  { href: "/in/delhi/online-tuition", label: "Online Tuition", desc: "One-to-one live online tuition across Indian time zones and all major boards.", icon: Laptop, post: "/post-online-tuition-request?country=IN" },
];

const cityIntents = [
  { slug: "delhi",     label: "Delhi" },
  { slug: "mumbai",    label: "Mumbai" },
  { slug: "bangalore", label: "Bangalore" },
  { slug: "chennai",   label: "Chennai" },
  { slug: "hyderabad", label: "Hyderabad" },
  { slug: "kolkata",   label: "Kolkata" },
];

const faq = [
  {
    q: "How does TUTORERA work in India?",
    a: "Students or parents post a tuition requirement — subject, board (CBSE, ICSE, IB, State Board), teaching mode, city, schedule and preferred budget in INR. Eligible tutors can submit offers, so the student or parent can compare options before choosing a tutor. Exact addresses and private contact details are not shown before a confirmed booking.",
  },
  {
    q: "Can I find a home tutor in Delhi, Mumbai or other Indian cities?",
    a: "Yes. Post a home-tuition requirement for your city and locality. Eligible home-tuition tutors matching your subject, board and schedule can send offers you can compare before choosing.",
  },
  {
    q: "Does TUTORERA support all Indian school boards?",
    a: "Yes. Online and home tuition matching considers subject, board (CBSE, ICSE, IB, State Board), language and budget compatibility. Select your board when posting a requirement.",
  },
  {
    q: "Who sets the tuition budget?",
    a: "The student or parent sets the initial preferred budget in INR when posting the requirement. Tutors can accept the budget or, where the request permits it, submit a counter-offer.",
  },
  {
    q: "Who chooses the tutor?",
    a: "The student or parent chooses. TUTORERA surfaces eligible tutors and their offers; the final selection is always the student or parent's decision.",
  },
  {
    q: "Are tutors on TUTORERA verified?",
    a: "Approved tutors complete identity and credential review before receiving tuition opportunities. Verification confirms the documents reviewed — it does not guarantee outcomes or teaching quality on its own. See the Trust & Safety Center for details.",
  },
];

export const metadata: Metadata = {
  title: { absolute: "Tuition in India — Home & Online Tutors | TUTORERA" },
  description:
    "Post a tuition requirement in India for home or online tuition, set your preferred budget in INR, and compare offers from eligible tutors. Delhi, Mumbai, Bangalore and nationwide.",
  alternates: { canonical: "/in" },
  openGraph: {
    title: "Tuition in India — Home & Online Tutors | TUTORERA",
    description: "Student-first tuition matching for India. Post a requirement, receive tutor offers, compare, and choose.",
    url: IN_URL,
  },
};

export default function IndiaLandingPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${IN_URL}#webpage`,
        name: "Tuition in India",
        description: "Post a tuition requirement in India for home or online tuition and compare eligible tutor offers.",
        url: IN_URL,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": `${IN_URL}#breadcrumb` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${IN_URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "India", item: IN_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(2rem,4vw,3.5rem) 1.25rem 5rem", color: "#0f172a" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav aria-label="Breadcrumb" style={{ fontSize: "0.9rem", marginBottom: "1.5rem", color: "#475569" }}>
        <Link href="/" style={{ color: "#0329b2" }}>Home</Link>{" / "}<span>India</span>
      </nav>

      <header style={{ maxWidth: 780 }}>
        <p style={{ color: "#016EF8", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Student-First Tutoring Marketplace · India
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, color: "#021550", margin: "0 0 1rem" }}>
          Tuition in India — Home &amp; Online Tutors
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#475569", marginBottom: "1.5rem" }}>
          Post your tuition requirement with a preferred budget in INR for home or online tuition. Eligible tutors can submit offers. Compare options and choose the tutor that fits your learning needs.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/post-tuition-request?country=IN" style={ctaPrimary}>Post Tuition Requirement <ArrowRight size={18} /></Link>
          <Link href="/tutors?countryCode=IN" style={ctaSecondary}>Find Tutors</Link>
        </div>
      </header>

      <section style={{ marginTop: "3rem", padding: "1.5rem 1.75rem", background: "#F5F7FF", borderRadius: "0.875rem" }}>
        <h2 style={{ color: "#021550", marginTop: 0 }}>How does TUTORERA work in India?</h2>
        <p style={{ color: "#374151", lineHeight: 1.7, margin: 0 }}>{faq[0].a}</p>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ color: "#021550" }}>Choose how you want to learn</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {learningModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div key={mode.href} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0329B2", marginBottom: "0.5rem" }}>
                  <Icon size={20} /><strong style={{ fontSize: "1.05rem" }}>{mode.label}</strong>
                </div>
                <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 1rem" }}>{mode.desc}</p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link href={mode.post} style={inlinePrimary}>Post {mode.label} requirement</Link>
                  <Link href={mode.href} style={inlineSecondary}>Read guide</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ color: "#021550" }}>Popular cities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
          {cityIntents.map((c) => (
            <div key={c.slug} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#0329B2", marginBottom: "0.5rem" }}>
                <MapPin size={16} /><strong>{c.label}</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                <Link href={`/in/${c.slug}/tuition`} style={linkStyle}>{c.label} tuition</Link>
                <Link href={`/in/${c.slug}/home-tuition`} style={linkStyle}>{c.label} home tuition</Link>
                <Link href={`/in/${c.slug}/online-tuition`} style={linkStyle}>{c.label} online tuition</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0329B2", marginBottom: "0.5rem" }}>
            <ShieldCheck size={18} /><strong>Trust &amp; Safety</strong>
          </div>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 0.5rem" }}>Verification confirms documents reviewed under the applicable market and teaching-mode policy — it does not guarantee outcomes.</p>
          <Link href="/safety" style={linkStyle}>Trust &amp; Safety Center →</Link>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0329B2", marginBottom: "0.5rem" }}>
            <GraduationCap size={18} /><strong>How TUTORERA works</strong>
          </div>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 0.5rem" }}>Post a requirement, receive offers from eligible tutors, compare, and choose. Your budget. Your schedule. Your choice of tutor.</p>
          <Link href="/how-it-works" style={linkStyle}>Read how it works →</Link>
        </div>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ color: "#021550" }}>Frequently asked questions</h2>
        {faq.slice(1).map((item) => (
          <div key={item.q} style={{ marginTop: "1.25rem" }}>
            <h3 style={{ color: "#021550", fontSize: "1.05rem", margin: "0 0 0.35rem" }}>{item.q}</h3>
            <p style={{ color: "#374151", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
          </div>
        ))}
      </section>

      <section style={{ marginTop: "3rem", padding: "2rem", background: "#021550", color: "white", borderRadius: "0.875rem", textAlign: "center" }}>
        <h2 style={{ color: "white", margin: "0 0 0.5rem" }}>Ready to find your tutor?</h2>
        <p style={{ color: "#94a3b8", margin: "0 0 1.25rem" }}>Post your tuition requirement in a few minutes and receive offers from eligible tutors.</p>
        <Link href="/post-tuition-request?country=IN" style={{ ...ctaPrimary, background: "#016ef8" }}>Post Tuition Requirement <ArrowRight size={18} /></Link>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
const linkStyle: React.CSSProperties = { color: "#0329b2", textDecoration: "none", fontWeight: 600 };
const ctaPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#0329b2", color: "white", padding: "0.85rem 1.5rem", borderRadius: "0.6rem", fontWeight: 800, textDecoration: "none" };
const ctaSecondary: React.CSSProperties = { display: "inline-flex", alignItems: "center", background: "white", color: "#021550", padding: "0.85rem 1.25rem", borderRadius: "0.6rem", fontWeight: 700, textDecoration: "none", border: "1.5px solid #cbd5e1" };
const inlinePrimary: React.CSSProperties = { background: "#0329b2", color: "white", padding: "0.55rem 0.95rem", borderRadius: "0.45rem", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" };
const inlineSecondary: React.CSSProperties = { color: "#0329b2", padding: "0.55rem 0.55rem", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" };
