import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { CITIES } from "@/lib/tutor-directory";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return Object.keys(CITIES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const city = CITIES[slug as keyof typeof CITIES]; if (!city) return {};
  const path = `/tutors/city/${slug}`;
  return { title: `Online & Home Tutors in ${city}`, description: `Find verified online and home tutors in ${city}. Compare subjects, teaching experience, ratings, availability, and hourly rates.`, alternates: { canonical: path }, openGraph: { title: `Tutors in ${city} | TUTORERA®`, description: `Browse verified tutors serving ${city}.`, url: path } };
}
export default async function Page({ params }: Props) {
  const { slug } = await params; const city = CITIES[slug as keyof typeof CITIES]; if (!city) notFound();
  return <SeoTutorDirectory kind="city" value={city} title={`Online & Home Tutors in ${city}`} description={`Find verified tutors serving ${city}, available online, in person, or both.`} canonicalPath={`/tutors/city/${slug}`} />;
}
