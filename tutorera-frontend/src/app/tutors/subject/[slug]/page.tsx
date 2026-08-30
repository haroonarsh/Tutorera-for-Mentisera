import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { SUBJECTS } from "@/lib/tutor-directory";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return Object.keys(SUBJECTS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const subject = SUBJECTS[slug as keyof typeof SUBJECTS]; if (!subject) return {};
  const path = `/tutors/subject/${slug}`;
  return { title: `${subject} Tutors in Pakistan`, description: `Find verified ${subject} tutors in Pakistan for online and in-person lessons. Compare experience, ratings, availability, and hourly rates.`, alternates: { canonical: path }, openGraph: { title: `${subject} Tutors in Pakistan | TUTORERA®`, description: `Browse verified ${subject} tutors across Pakistan.`, url: path } };
}
export default async function Page({ params }: Props) {
  const { slug } = await params; const subject = SUBJECTS[slug as keyof typeof SUBJECTS]; if (!subject) notFound();
  return <SeoTutorDirectory kind="subject" value={subject} title={`${subject} Tutors in Pakistan`} description={`Compare verified ${subject} tutors for online and in-person lessons across Pakistan.`} canonicalPath={`/tutors/subject/${slug}`} />;
}
