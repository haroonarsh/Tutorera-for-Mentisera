import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { LEVELS } from "@/lib/tutor-directory";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return Object.keys(LEVELS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const level = LEVELS[slug as keyof typeof LEVELS]; if (!level) return {};
  const path = `/tutors/level/${slug}`;
  return { title: `${level} Tutors in Pakistan`, description: `Find verified ${level} tutors in Pakistan for online and in-person learning. Compare profiles, ratings, availability, and rates.`, alternates: { canonical: path } };
}
export default async function Page({ params }: Props) {
  const { slug } = await params; const level = LEVELS[slug as keyof typeof LEVELS]; if (!level) notFound();
  return <SeoTutorDirectory kind="level" value={level} title={`${level} Tutors in Pakistan`} description={`Browse verified tutors experienced in teaching students at ${level} level.`} canonicalPath={`/tutors/level/${slug}`} />;
}
