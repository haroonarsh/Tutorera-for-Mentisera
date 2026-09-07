import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { CITIES, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS } from "@/lib/tutor-directory";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(SUBJECTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const subject = SUBJECTS[slug as keyof typeof SUBJECTS];
  if (!subject) return {};
  const path = `/tutors/subject/${slug}`;

  return {
    title: `${subject} Tutors Online & Locally`,
    description: `Find verified ${subject} tutors for online worldwide learning and local in-person lessons where available. Compare experience, ratings, availability, and rates.`,
    alternates: { canonical: path },
    openGraph: {
      title: `${subject} Tutors Online & Locally | TUTORERA®`,
      description: `Browse verified ${subject} tutors through TUTORERA's student-led marketplace.`,
      url: path,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const subject = SUBJECTS[slug as keyof typeof SUBJECTS];
  if (!subject) notFound();

  return (
    <>
      <SeoTutorDirectory
        kind="subject"
        value={subject}
        title={`${subject} Tutors Online & Locally`}
        description={`Compare verified ${subject} tutors for online worldwide learning and local in-person lessons where available.`}
        canonicalPath={`/tutors/subject/${slug}`}
      />
      {LOCAL_SUBJECT_SLUGS.includes(slug as (typeof LOCAL_SUBJECT_SLUGS)[number]) && (
        <nav aria-label={`${subject} tutors by city`} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>{subject} tutors by city</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>
            {PRIMARY_CITY_SLUGS.map((citySlug) => (
              <Link
                key={citySlug}
                href={`/tutors/city/${citySlug}/${slug}`}
                style={{ color: "#0329B2", background: "#EEF5FF", padding: ".6rem 1rem", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}
              >
                {CITIES[citySlug]}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
