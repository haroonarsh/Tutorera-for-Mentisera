import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoTutorDirectory from "@/components/Tutors/SeoTutorDirectory";
import { CITIES, LEVELS, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS, fetchTutors } from "@/lib/tutor-directory";
import { SeoEligibilityService } from "@/lib/seo-eligibility";

const TOP_LEVEL_SLUGS = ["primary", "matric", "o-level", "igcse", "a-level"] as const;

type Props = { params: Promise<{ slug: string; subject: string }> };

export function generateStaticParams() {
  // All cities × core subjects for static generation
  return (Object.keys(CITIES) as (keyof typeof CITIES)[]).flatMap((slug) =>
    LOCAL_SUBJECT_SLUGS.map((subject) => ({ slug, subject })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subject: subjectSlug } = await params;
  const city = CITIES[slug as keyof typeof CITIES];
  const subject = SUBJECTS[subjectSlug as keyof typeof SUBJECTS];
  if (!city || !subject) return {};
  const path = `/tutors/city/${slug}/${subjectSlug}`;
  const { total } = await fetchTutors({ city, subject }, 1);
  const eligibility = SeoEligibilityService.evaluatePage({ activeApprovedTutors: total, homeTuitionEnabled: true });

  return {
    title: `${subject} Tutor in ${city} — Find Verified ${subject} Tutors | TUTORERA`,
    description: `Find a verified ${subject} tutor in ${city} for online or in-person lessons. Post your requirement, set a budget, and compare ${subject} tutor offers on TUTORERA.`,
    alternates: { canonical: path },
    robots: eligibility === "INDEX" ? "index, follow" : "noindex, follow",
    openGraph: {
      title: `${subject} Tutor in ${city} | TUTORERA®`,
      description: `Compare verified ${subject} tutors serving ${city}. Post free — eligible tutors send offers you compare before choosing.`,
      url: path,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug, subject: subjectSlug } = await params;
  const city = CITIES[slug as keyof typeof CITIES];
  const subject = SUBJECTS[subjectSlug as keyof typeof SUBJECTS];
  if (!city || !subject) notFound();

  const canonical = `https://tutorera.ac.pk/tutors/city/${slug}/${subjectSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: `${subject} Tutor in ${city}`,
        url: canonical,
        description: `Find a verified ${subject} tutor in ${city}. Post your requirement on TUTORERA and compare offers from approved tutors.`,
        isPartOf: { "@id": "https://tutorera.ac.pk/#website" },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tutorera.ac.pk/" },
          { "@type": "ListItem", position: 2, name: "Find Tutors", item: "https://tutorera.ac.pk/tutors" },
          { "@type": "ListItem", position: 3, name: `Tutors in ${city}`, item: `https://tutorera.ac.pk/tutors/city/${slug}` },
          { "@type": "ListItem", position: 4, name: `${subject} Tutor in ${city}`, item: canonical },
        ],
      },
      {
        "@type": "Service",
        name: `${subject} Tutoring in ${city}`,
        description: `Personalised ${subject} tutoring sessions in ${city}, available online or in person. Students post requirements; verified tutors submit offers to compare.`,
        provider: { "@type": "Organization", name: "TUTORERA", url: "https://tutorera.ac.pk" },
        serviceType: "Private tutoring",
        areaServed: city,
        url: canonical,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How do I find a ${subject} tutor in ${city}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Post a free ${subject} tuition requirement on TUTORERA. Include your level, curriculum, preferred schedule, teaching mode (online or in-person in ${city}), and budget. Verified ${subject} tutors can then send you offers to compare before you choose.`,
            },
          },
          {
            "@type": "Question",
            name: `Are ${subject} tutors in ${city} verified?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. TUTORERA requires every tutor to submit qualifications and pass subject-specific approval before responding to ${subject} tuition requirements in ${city} or anywhere else.`,
            },
          },
        ],
      },
    ],
  };

  const relatedLinks = LOCAL_SUBJECT_SLUGS
    .filter((s) => s !== subjectSlug)
    .slice(0, 8)
    .map((s) => ({ label: `${SUBJECTS[s as keyof typeof SUBJECTS]} in ${city}`, href: `/tutors/city/${slug}/${s}` }));

  const levelLinks = PRIMARY_CITY_SLUGS.includes(slug as typeof PRIMARY_CITY_SLUGS[number]) && LOCAL_SUBJECT_SLUGS.slice(0, 5).includes(subjectSlug as (typeof LOCAL_SUBJECT_SLUGS)[number])
    ? TOP_LEVEL_SLUGS.map((levelSlug) => ({
        label: `${LEVELS[levelSlug]} ${subject} in ${city}`,
        href: `/tutors/city/${slug}/${subjectSlug}/${levelSlug}`,
      }))
    : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoTutorDirectory
        kind="city"
        value={city}
        filters={{ city, subject }}
        title={`${subject} Tutor in ${city}`}
        description={`Compare verified ${subject} tutors available in ${city} for online and in-person lessons.`}
        canonicalPath={`/tutors/city/${slug}/${subjectSlug}`}
        relatedLinks={[...levelLinks, ...relatedLinks]}
      />
    </>
  );
}
