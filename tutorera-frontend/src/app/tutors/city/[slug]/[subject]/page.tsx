import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { CITIES, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS, fetchTutors } from "@/lib/tutor-directory";

type Props = { params: Promise<{ slug: string; subject: string }> };

export function generateStaticParams() {
  return PRIMARY_CITY_SLUGS.flatMap((slug) => LOCAL_SUBJECT_SLUGS.map((subject) => ({ slug, subject })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subject: subjectSlug } = await params;
  const city = CITIES[slug as keyof typeof CITIES];
  const subject = SUBJECTS[subjectSlug as keyof typeof SUBJECTS];
  if (!city || !subject) return {};
  const path = `/tutors/city/${slug}/${subjectSlug}`;
  const { total } = await fetchTutors({ city, subject }, 1);
  const title = `${subject} Tutors in ${city}`;
  return {
    title,
    description: `Find verified ${subject} tutors in ${city} for online and in-person lessons. Compare experience, ratings, availability, and hourly rates.`,
    alternates: { canonical: path },
    robots: total > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${title} | TUTORERA®`, description: `Browse verified ${subject} tutors serving ${city}.`, url: path },
  };
}

export default async function Page({ params }: Props) {
  const { slug, subject: subjectSlug } = await params;
  const city = CITIES[slug as keyof typeof CITIES];
  const subject = SUBJECTS[subjectSlug as keyof typeof SUBJECTS];
  if (!city || !subject || !PRIMARY_CITY_SLUGS.includes(slug as typeof PRIMARY_CITY_SLUGS[number]) || !LOCAL_SUBJECT_SLUGS.includes(subjectSlug as typeof LOCAL_SUBJECT_SLUGS[number])) notFound();
  return <SeoTutorDirectory kind="city" value={city} filters={{ city, subject }} title={`${subject} Tutors in ${city}`} description={`Compare verified ${subject} tutors available in ${city} for online and in-person lessons.`} canonicalPath={`/tutors/city/${slug}/${subjectSlug}`} />;
}
