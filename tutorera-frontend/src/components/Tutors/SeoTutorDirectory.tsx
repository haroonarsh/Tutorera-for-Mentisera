import Link from "next/link";
import TutorCard from "@/components/Tutors/TutorCard";
import { fetchTutors, type DirectoryKind } from "@/lib/tutor-directory";
import styles from "@/app/tutors/page.module.css";

interface Props { kind: DirectoryKind; value: string; filters?: Partial<Record<DirectoryKind, string>>; title: string; description: string; canonicalPath: string; }

export default async function SeoTutorDirectory({ kind, value, filters, title, description, canonicalPath }: Props) {
  const result = await fetchTutors(filters ?? { [kind]: value });
  const rates = result.tutors.map((tutor) => tutor.hourlyRate).filter(Boolean);
  const averageRate = rates.length ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length) : 0;
  const context = filters?.city && filters?.subject ? `${filters.subject} tutoring in ${filters.city}` : `${value} tutoring`;
  const faq = [
    { q: `How do I choose a ${value} tutor?`, a: `Compare verified profiles by relevant subjects, teaching levels, experience, lesson mode, availability, completed-booking reviews, and hourly rate. Discuss learning goals before confirming a booking.` },
    { q: `Can I book ${context} online?`, a: `Yes. Use the teaching-mode information on each profile to find tutors offering online lessons, in-person lessons, or both.` },
    { q: `How much does ${context} cost?`, a: averageRate ? `The currently displayed matching tutors average approximately PKR ${averageRate.toLocaleString()} per hour. Individual rates vary by experience, subject, level, and lesson mode.` : `Rates vary by experience, subject, academic level, location, and lesson mode. Each available tutor publishes an hourly rate on their profile.` },
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
    { "@type": "ItemList", name: title, numberOfItems: result.tutors.length, itemListElement: result.tutors.map((tutor, index) => ({ "@type": "ListItem", position: index + 1, url: `https://tutorera.ac.pk/tutors/${tutor._id}`, name: tutor.user?.name })) },
    { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
  ] };

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }} />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroSubtitle}>{description}</p>
        </div>
      </div>
      <main className={styles.main} style={{ maxWidth: 1180, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <p className={styles.resultsCount}><span className={styles.resultsCountAccent}>{result.total}</span> verified tutors found</p>
        {result.tutors.length ? (
          <div className={styles.grid}>{result.tutors.map((tutor) => <TutorCard key={tutor._id} tutor={tutor} />)}</div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <h2 style={{ marginBottom: ".75rem" }}>No matching tutors are currently listed</h2>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Browse all verified tutors or post a request for this requirement.</p>
            <Link href="/tutors" style={{ color: "#2563eb", fontWeight: 700 }}>Browse all tutors</Link>
          </div>
        )}
      </main>
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem 4rem", color: "#4b5563", lineHeight: 1.8 }}>
        <h2 style={{ color: "#1a1a2e", marginBottom: ".75rem" }}>Choosing the right tutor</h2>
        <p>TUTORERA currently lists {result.total} approved {result.total === 1 ? "profile" : "profiles"} matching this requirement. Profiles show the tutor’s subjects, academic levels, city, teaching mode, rate, experience, availability, verification status, and completed-booking reviews where available.</p>
        <p style={{ marginTop: ".75rem" }}>For the best match, identify the exact curriculum or examination, topics requiring support, preferred lesson schedule, and whether online or in-person teaching is suitable. Shortlist tutors whose documented experience and teaching levels align with those needs.</p>
        <h2 style={{ color: "#1a1a2e", margin: "2rem 0 .75rem" }}>Frequently asked questions</h2>
        {faq.map((item) => <div key={item.q} style={{ marginBottom: "1.25rem" }}><h3 style={{ color: "#1a1a2e", fontSize: "1rem" }}>{item.q}</h3><p>{item.a}</p></div>)}
      </section>
    </div>
  );
}
