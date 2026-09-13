import Link from "next/link";
import TutorCard from "@/components/Tutors/TutorCard";
import { fetchTutors, type DirectoryKind, type TutorSearchFilters, tutorProfileHref } from "@/lib/tutor-directory";
import styles from "@/app/tutors/page.module.css";

interface Props { kind: DirectoryKind; value: string; filters?: TutorSearchFilters; title: string; description: string; canonicalPath: string; currency?: string; relatedLinks?: { label: string, href: string }[]; }

export default async function SeoTutorDirectory({ kind, value, filters, title, description, canonicalPath, currency, relatedLinks }: Props) {
  const result = await fetchTutors(filters ?? { [kind]: value });
  const rates = result.tutors.map((tutor) => tutor.hourlyRate).filter(Boolean);
  const averageRate = rates.length ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length) : 0;
  const displayCurrency = currency || result.tutors.find((t) => t.currency)?.currency || "PKR";
  const context = filters?.city && filters?.subject ? `${filters.subject} tutoring in ${filters.city}` : `${value} tutoring`;
  const faq = [
    { q: `How do I choose a ${value} tutor?`, a: `Compare verified profiles by relevant subjects, teaching levels, experience, lesson mode, availability, completed-booking reviews, and hourly rate. Discuss learning goals before confirming a booking.` },
    { q: `Can I book ${context} online?`, a: `Yes. Use the teaching-mode information on each profile to find tutors offering online lessons, in-person lessons, or both.` },
    { q: `How much does ${context} cost?`, a: averageRate ? `The currently displayed matching tutors average approximately ${displayCurrency} ${averageRate.toLocaleString()} per hour. Individual rates vary by experience, subject, level, and lesson mode.` : `Rates vary by experience, subject, academic level, location, and lesson mode. Each available tutor publishes an hourly rate on their profile.` },
  ];
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tutorera.ac.pk/" },
      { "@type": "ListItem", position: 2, name: "Tutors", item: "https://tutorera.ac.pk/tutors" },
      { "@type": "ListItem", position: 3, name: title, item: `https://tutorera.ac.pk${canonicalPath}` },
    ],
  };
  const directorySchema = { "@context": "https://schema.org", "@graph": [
    breadcrumb,
    { "@type": "ItemList", name: title, numberOfItems: result.tutors.length, itemListElement: result.tutors.map((tutor, index) => ({ "@type": "ListItem", position: index + 1, url: `https://tutorera.ac.pk${tutorProfileHref(tutor)}`, name: tutor.user?.name })) },
    { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
  ] };

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }} />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroSubtitle}>{description}</p>
          <p style={{ fontSize: "1rem", fontWeight: 800, color: "white", background: "rgba(255,255,255,0.15)", display: "inline-block", padding: "0.5rem 1.1rem", borderRadius: "999px", margin: "1rem 0 0" }}>
            Post your requirement — tutors compete with offers
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <Link
              href="/post-tuition-request"
              style={{
                background: "white",
                color: "#021550",
                padding: "0.85rem 1.75rem",
                borderRadius: "0.625rem",
                fontWeight: 800,
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
              }}
            >
              + Post Tuition Request & Receive Offers
            </Link>
          </div>
        </div>
      </div>
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[
            { step: "1", label: "Post your requirement", desc: "Subject, level, budget, schedule" },
            { step: "2", label: "Tutors send competing offers", desc: "Compare rates, experience, verification" },
            { step: "3", label: "Choose & book with confidence", desc: "You pick the best-fit offer, not us" },
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#0329B2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0 }}>{s.step}</span>
              <div>
                <p style={{ fontWeight: 700, color: "#021550", margin: 0, fontSize: "0.9rem" }}>{s.label}</p>
                <p style={{ color: "#64748b", margin: "0.15rem 0 0", fontSize: "0.8rem" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <main className={styles.main} style={{ maxWidth: 1180, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <p className={styles.resultsCount}><span className={styles.resultsCountAccent}>{result.total}</span> verified tutors found</p>
        {result.tutors.length ? (
          <div className={styles.grid}>{result.tutors.map((tutor) => <TutorCard key={tutor._id} tutor={tutor} />)}</div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "white", borderRadius: "1rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ marginBottom: ".75rem", color: "#021550" }}>No matching tutors listed right now</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Tell us your exact requirements and let verified tutors send offers directly to you.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/post-tuition-request" style={{ background: "#0329B2", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 800, textDecoration: "none" }}>
                Post Tuition Request
              </Link>
              <Link href="/tutors" style={{ color: "#0329B2", fontWeight: 700, padding: "0.75rem 1rem", textDecoration: "none" }}>
                Browse all tutors →
              </Link>
            </div>
          </div>
        )}
      </main>
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem 4rem", color: "#4b5563", lineHeight: 1.8 }}>
        <h2 style={{ color: "#021550", marginBottom: ".75rem" }}>Choosing the right tutor</h2>
        <p>TUTORERA currently lists {result.total} approved {result.total === 1 ? "profile" : "profiles"} matching this requirement. Profiles show the tutor’s subjects, academic levels, city, teaching mode, rate, experience, availability, verification status, and completed-booking reviews where available.</p>
        <p style={{ marginTop: ".75rem" }}>For the best match, identify the exact curriculum or examination, topics requiring support, preferred lesson schedule, and whether online or in-person teaching is suitable. Shortlist tutors whose documented experience and teaching levels align with those needs.</p>
        <h2 style={{ color: "#021550", margin: "2rem 0 .75rem" }}>Frequently asked questions</h2>
        {faq.map((item) => <div key={item.q} style={{ marginBottom: "1.25rem" }}><h3 style={{ color: "#021550", fontSize: "1rem" }}>{item.q}</h3><p>{item.a}</p></div>)}
        
        {relatedLinks && relatedLinks.length > 0 && (
          <>
            <h2 style={{ color: "#021550", margin: "2rem 0 .75rem" }}>Related Searches</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "999px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#0329b2",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
