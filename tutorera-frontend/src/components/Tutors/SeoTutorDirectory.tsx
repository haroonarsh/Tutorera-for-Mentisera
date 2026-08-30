import Link from "next/link";
import TutorCard from "@/components/Tutors/TutorCard";
import { fetchTutors, type DirectoryKind } from "@/lib/tutor-directory";
import styles from "@/app/tutors/page.module.css";

interface Props { kind: DirectoryKind; value: string; title: string; description: string; canonicalPath: string; }

export default async function SeoTutorDirectory({ kind, value, title, description, canonicalPath }: Props) {
  const result = await fetchTutors({ [kind]: value });
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tutorera.ac.pk/" },
      { "@type": "ListItem", position: 2, name: "Tutors", item: "https://tutorera.ac.pk/tutors" },
      { "@type": "ListItem", position: 3, name: title, item: `https://tutorera.ac.pk${canonicalPath}` },
    ],
  };

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
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
    </div>
  );
}
