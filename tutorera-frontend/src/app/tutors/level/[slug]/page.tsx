import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import CurriculumInfo from "@/components/Tutors/CurriculumInfo";
import { LEVELS } from "@/lib/tutor-directory";
import { LEVEL_CONTENT } from "@/lib/curriculum-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(LEVELS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const level = LEVELS[slug as keyof typeof LEVELS];
  if (!level) return {};
  const path = `/tutors/level/${slug}`;

  return {
    title: `${level} Tutors Online & Locally`,
    description: `Find verified ${level} tutors for online worldwide learning and local in-person lessons where available. Compare profiles, ratings, availability, and rates.`,
    alternates: { canonical: path },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const level = LEVELS[slug as keyof typeof LEVELS];
  if (!level) notFound();

  const curriculum = LEVEL_CONTENT[slug];

  return (
    <>
      <SeoTutorDirectory
        kind="level"
        value={level}
        title={`${level} Tutors Online & Locally`}
        description={`Browse verified tutors experienced in teaching students at ${level} level for online worldwide and local in-person support.`}
        canonicalPath={`/tutors/level/${slug}`}
      />
      {curriculum && <CurriculumInfo content={curriculum} />}
    </>
  );
}
