import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Home, Laptop, MapPin, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { CITIES, fetchTutors } from "@/lib/tutor-directory";

// Explicit /pk landing beats the (countries)/[countryCode] catch-all for
// Pakistan specifically, giving the primary market the authority hub P1
// items 10–19 of the SEO/AEO/LLMO spec call for. Content is entity-first
// and links only to shipped intent + supply routes.

const PK_URL = `${SITE_URL}/pk`;

const learningModes = [
  { href: "/pk/home-tuition",   label: "Home Tuition",   desc: "Verified tutors teaching at a location that works for the student.", icon: Home,   post: "/post-home-tuition-request" },
  { href: "/pk/online-tuition", label: "Online Tuition", desc: "One-to-one live tuition across Pakistan and international timezones.",  icon: Laptop, post: "/post-online-tuition-request" },
];

const subjectIntents = [
  { href: "/pk/mathematics-tuition", label: "Mathematics" },
  { href: "/pk/physics-tuition",     label: "Physics" },
  { href: "/pk/chemistry-tuition",   label: "Chemistry" },
  { href: "/pk/biology-tuition",     label: "Biology" },
  { href: "/pk/english-tuition",     label: "English" },
  { href: "/pk/o-level-tuition",    label: "O Level" },
  { href: "/pk/a-level-tuition",    label: "A Level" },
  { href: "/pk/mdcat-tutoring",     label: "MDCAT" },
];

const cityIntents = [
  { slug: "islamabad",  label: "Islamabad" },
  { slug: "rawalpindi", label: "Rawalpindi" },
  { slug: "lahore",     label: "Lahore" },
  { slug: "karachi",    label: "Karachi" },
];

const faq = [
  {
    q: "How does TUTORERA work in Pakistan?",
    a: "Students or parents post a tuition requirement — subject, curriculum, teaching mode, area or timezone, schedule and preferred budget. Eligible tutors can submit offers, so the student or parent can compare options before choosing a tutor. Exact addresses and private contact details are not shown before a confirmed booking.",
  },
  {
    q: "Can I find a home tutor in Pakistan on TUTORERA?",
    a: "Yes. Post a home-tuition requirement for your city and area. Eligible home-tuition tutors matching your subject, level and schedule can send offers you can compare before choosing.",
  },
  {
    q: "Does TUTORERA support online tuition in Pakistan?",
    a: "Yes. Online tuition matching considers subject, curriculum, language, timezone and budget compatibility rather than the tutor's physical city.",
  },
  {
    q: "Who sets the tuition budget?",
    a: "The student or parent sets the initial preferred budget when posting the requirement. Tutors can accept the budget or, where the request permits it, submit a counter-offer.",
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
  title: { absolute: "Tuition in Pakistan — Home & Online Tutors | TUTORERA" },
  description:
    "Post a tuition requirement in Pakistan for home or online tuition, set your preferred budget, and compare offers from eligible tutors. Islamabad, Rawalpindi, Lahore, Karachi and nationwide.",
  alternates: { canonical: "/pk" },
  openGraph: {
    title: "Tuition in Pakistan — Home & Online Tutors | TUTORERA",
    description: "Student-first tuition matching for Pakistan. Post a requirement, receive tutor offers, compare, and choose.",
    url: PK_URL,
  },
};

export default async function PakistanLandingPage() {
  // Only surface cities that actually have tutor supply — the SEO spec §34
  // forbids indexing thin doorway combinations. Threshold matches the
  // sitemap gating for the /pk/home-tutors/[city] pages.
  const cityCounts = await Promise.all(
    cityIntents.map((c) => fetchTutors({ countryCode: "PK", city: CITIES[c.slug as keyof typeof CITIES] }, 1).then((r) => r.total)),
  );
  const activeCities = cityIntents.map((c, i) => ({ ...c, total: cityCounts[i] })).filter((c) => c.total >= 3);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PK_URL}#webpage`,
        name: "Tuition in Pakistan",
        description: "Post a tuition requirement in Pakistan for home or online tuition and compare eligible tutor offers.",
        url: PK_URL,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": `${PK_URL}#breadcrumb` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-PK",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${PK_URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Pakistan", item: PK_URL },
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
        <Link href="/" style={{ color: "#0329b2" }}>Home</Link>{" / "}<span>Pakistan</span>
      </nav>

      <header style={{ maxWidth: 780 }}>
        <p style={{ color: "#016EF8", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Student-First Tutoring Marketplace · Pakistan
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, color: "#021550", margin: "0 0 1rem" }}>
          Tuition in Pakistan — Home &amp; Online Tutors
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#475569", marginBottom: "1.5rem" }}>
          Post your tuition requirement with a preferred budget for home or online tuition. Eligible tutors can submit offers. Compare options and choose the tutor that fits your learning needs.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/post-tuition-request?country=PK" style={ctaPrimary}>Post Tuition Requirement <ArrowRight size={18} /></Link>
          <Link href="/tutors?countryCode=PK" style={ctaSecondary}>Find Tutors</Link>
        </div>
      </header>

      {/* Direct answer — spec §16, §17 (answer-first) */}
      <section style={{ marginTop: "3rem", padding: "1.5rem 1.75rem", background: "#F5F7FF", borderRadius: "0.875rem" }}>
        <h2 style={{ color: "#021550", marginTop: 0 }}>How does TUTORERA work in Pakistan?</h2>
        <p style={{ color: "#374151", lineHeight: 1.7, margin: 0 }}>{faq[0].a}</p>
      </section>

      {/* Learning modes */}
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

      {/* City intents — supply-gated per spec §34 */}
      {activeCities.length > 0 && (
        <section style={{ marginTop: "3rem" }}>
          <h2 style={{ color: "#021550" }}>Popular cities in Pakistan</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
            {activeCities.map((c) => (
              <div key={c.slug} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#0329B2", marginBottom: "0.5rem" }}>
                  <MapPin size={16} /><strong>{c.label}</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                  <Link href={`/pk/${c.slug}/tuition`} style={linkStyle}>{c.label} tuition</Link>
                  <Link href={`/pk/${c.slug}/home-tuition`} style={linkStyle}>{c.label} home tuition</Link>
                  <Link href={`/pk/${c.slug}/online-tuition`} style={linkStyle}>{c.label} online tuition</Link>
                  <Link href={`/pk/home-tutors/${c.slug}`} style={linkStyle}>Browse home tutors in {c.label}</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subject and curriculum intents */}
      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ color: "#021550" }}>Popular subjects and curricula</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
          {subjectIntents.map((s) => (
            <Link key={s.href} href={s.href} style={chipStyle}>{s.label}</Link>
          ))}
        </div>
      </section>

      {/* Trust + methodology */}
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
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0329B2", marginBottom: "0.5rem" }}>
            <strong>Market research</strong>
          </div>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 0.5rem" }}>First-party marketplace data on tuition demand, subjects and budgets across Pakistan.</p>
          <Link href="/research/pakistan-tutoring-rates" style={linkStyle}>Pakistan tutoring rates →</Link>
        </div>
      </section>

      {/* FAQ — real Q&A rendered on the page and mirrored in FAQPage schema */}
      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ color: "#021550" }}>Frequently asked questions</h2>
        {faq.slice(1).map((item) => (
          <div key={item.q} style={{ marginTop: "1.25rem" }}>
            <h3 style={{ color: "#021550", fontSize: "1.05rem", margin: "0 0 0.35rem" }}>{item.q}</h3>
            <p style={{ color: "#374151", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section style={{ marginTop: "3rem", padding: "2rem", background: "#021550", color: "white", borderRadius: "0.875rem", textAlign: "center" }}>
        <h2 style={{ color: "white", margin: "0 0 0.5rem" }}>Ready to find your tutor?</h2>
        <p style={{ color: "#94a3b8", margin: "0 0 1.25rem" }}>Post your tuition requirement in a few minutes and receive offers from eligible tutors.</p>
        <Link href="/post-tuition-request?country=PK" style={{ ...ctaPrimary, background: "#016ef8" }}>Post Tuition Requirement <ArrowRight size={18} /></Link>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
const linkStyle: React.CSSProperties = { color: "#0329b2", textDecoration: "none", fontWeight: 600 };
const chipStyle: React.CSSProperties = { background: "#eef5ff", border: "1px solid #bfdbfe", color: "#0329b2", padding: "0.5rem 0.9rem", borderRadius: "999px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" };
const ctaPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#0329b2", color: "white", padding: "0.85rem 1.5rem", borderRadius: "0.6rem", fontWeight: 800, textDecoration: "none" };
const ctaSecondary: React.CSSProperties = { display: "inline-flex", alignItems: "center", background: "white", color: "#021550", padding: "0.85rem 1.25rem", borderRadius: "0.6rem", fontWeight: 700, textDecoration: "none", border: "1.5px solid #cbd5e1" };
const inlinePrimary: React.CSSProperties = { background: "#0329b2", color: "white", padding: "0.55rem 0.95rem", borderRadius: "0.45rem", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" };
const inlineSecondary: React.CSSProperties = { color: "#0329b2", padding: "0.55rem 0.55rem", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" };
