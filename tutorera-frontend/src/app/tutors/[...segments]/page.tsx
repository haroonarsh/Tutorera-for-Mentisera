import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchTutor, fetchTutorBySlug, tutorProfileHref } from "@/lib/tutor-directory";
import { generateTutorProfileMetadata, TutorProfilePageBody } from "../_shared/TutorProfilePage";
import type { TutorProfile } from "@/types/tutor";

// A single catch-all route handles both tutor profile URL shapes, because
// Next.js's App Router does not allow two sibling dynamic folders with
// different param names (e.g. [id] and [country]) at the same level:
//
// - 1 segment  -> /tutors/{legacyObjectIdEmbeddedSlug}        (pre-migration links)
// - 2 segments -> /tutors/{country}/{slug}                    (canonical, SEO-friendly)
//
// A profile that has a persisted `slug` (post-backfill) hit via the legacy
// 1-segment shape is 301-redirected to its canonical 2-segment URL.
type Props = { params: Promise<{ segments: string[] }> };

async function resolveTutor(segments: string[]): Promise<{ tutor: TutorProfile | null; isLegacy: boolean }> {
  if (segments.length >= 2) {
    const [country, slug] = segments;
    return { tutor: await fetchTutorBySlug(country, slug), isLegacy: false };
  }
  return { tutor: await fetchTutor(segments[0] || ""), isLegacy: true };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const { tutor } = await resolveTutor(segments);
  return generateTutorProfileMetadata(tutor);
}

export default async function TutorProfileRoute({ params }: Props) {
  const { segments } = await params;
  const { tutor, isLegacy } = await resolveTutor(segments);

  if (isLegacy && tutor?.slug) {
    redirect(tutorProfileHref(tutor));
  }

  return <TutorProfilePageBody tutor={tutor} />;
}
