import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { CITIES, LOCAL_SUBJECT_SLUGS, SUBJECTS, fetchTutors } from "@/lib/tutor-directory";
import { SeoEligibilityService } from "@/lib/seo-eligibility";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return Object.keys(CITIES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const city = CITIES[slug as keyof typeof CITIES]; if (!city) return {};
  const path = `/tutors/city/${slug}`;
  // Every city in CITIES gets a static page regardless of whether TUTORERA
  // actually has tutors there yet - gate indexability on real supply so
  // near-empty cities don't get indexed as if they were useful clusters.
  const { total } = await fetchTutors({ city }, 1);
  const eligibility = SeoEligibilityService.evaluatePage({ activeApprovedTutors: total, homeTuitionEnabled: true });
  const robotsString = eligibility === "INDEX" ? "index, follow" : "noindex, follow";
  return { title: `Online & Home Tutors in ${city}`, description: `Find verified online and home tutors in ${city}. Compare subjects, teaching experience, ratings, availability, and hourly rates.`, alternates: { canonical: path }, robots: robotsString, openGraph: { title: `Tutors in ${city} | TUTORERA®`, description: `Browse verified tutors serving ${city}.`, url: path } };
}
export default async function Page({ params }: Props) {
  const { slug } = await params; const city = CITIES[slug as keyof typeof CITIES]; if (!city) notFound();
  return <><SeoTutorDirectory kind="city" value={city} title={`Online & Home Tutors in ${city}`} description={`Find verified tutors serving ${city}, available online, in person, or both.`} canonicalPath={`/tutors/city/${slug}`} /><nav aria-label={`Popular subjects in ${city}`} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 4rem" }}><h2 style={{ marginBottom: "1rem" }}>Popular tutors in {city}</h2><div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>{LOCAL_SUBJECT_SLUGS.map((subjectSlug) => <Link key={subjectSlug} href={`/tutors/city/${slug}/${subjectSlug}`} style={{ color: "#0329B2", background: "#EEF5FF", padding: ".6rem 1rem", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}>{SUBJECTS[subjectSlug]} tutors</Link>)}</div></nav></>;
}
