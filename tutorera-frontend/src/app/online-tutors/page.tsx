import type { Metadata } from "next";
import TutorsExplorer from "@/components/Tutors/TutorsExplorer";
import { fetchTutors } from "@/lib/tutor-directory";
import type { FiltersState } from "@/types/tutor";
import { SITE_URL } from "@/lib/site";

const onlineFaqs = [
  {
    q: "How does online tutoring work on TUTORERA?",
    a: "Students post their subject, curriculum, timezone, and preferred budget. Eligible tutors can submit customised offers. After a booking is confirmed, the tutor and learner follow the agreed online-session arrangements.",
  },
  {
    q: "What curricula do online tutors cover?",
    a: "Tutor profiles state their subjects, curricula, and teaching experience. Availability depends on the profiles and requests active in the relevant market.",
  },
  {
    q: "In what currencies can I pay for online tutoring?",
    a: "You can view and agree on rates in the request currency. Checkout availability is determined by the selected market: Pakistan currently supports checkout, while UAE and UK discovery beta supports discovery, offers, and negotiation only.",
  },
  {
    q: "What timezone scheduling is supported?",
    a: "Requests store their selected timezone and schedule details. Tutors can respond when their stated availability fits the requested time.",
  },
];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const value = (input: string | string[] | undefined) => (typeof input === "string" ? input : "");

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params).some((rawValue) => value(rawValue).trim().length > 0);
  return {
    title: "Find Online Tutors | Post a Requirement | TUTORERA",
    description: "Post an online-tuition requirement with your subject, schedule, and preferred budget. Eligible tutors can submit offers for you to compare before choosing.",
    alternates: { canonical: "/online-tutors" },
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "Find Online Tutors | TUTORERA",
      description: "Post an online-tuition requirement and compare eligible tutor offers before choosing.",
      url: `${SITE_URL}/online-tutors`,
    },
  };
}

export default async function OnlineTutorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialFilters: Partial<FiltersState> = {
    search: value(params.search),
    country: value(params.country || params.countryCode),
    city: value(params.city),
    level: value(params.level),
    teachingMode: "online",
    minPrice: value(params.minPrice),
    maxPrice: value(params.maxPrice),
    minRating: value(params.minRating),
    sortBy: value(params.sortBy) || "rating",
  } as Partial<FiltersState>;

  const subject = value(params.subject);
  if (subject && !initialFilters.search) initialFilters.search = subject;

  const result = await fetchTutors(
    {
      search: initialFilters.search,
      city: initialFilters.city,
      countryCode: value(params.countryCode),
      country: value(params.country),
      level: initialFilters.level,
      subject,
      teachingMode: "online",
      minPrice: initialFilters.minPrice,
      maxPrice: initialFilters.maxPrice,
      minRating: initialFilters.minRating,
    },
    12
  );

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: onlineFaqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <TutorsExplorer
        initialTutors={result.tutors}
        initialPagination={{
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: 12,
        }}
        initialFilters={initialFilters}
        title="Find Online Tutors"
        subtitle={
          result.total
            ? `${result.total} online tutor profiles matching this directory view`
            : "Post an online-tuition requirement to receive eligible tutor offers"
        }
      />
      <section style={{ maxWidth: 1120, margin: "2rem auto 4rem", padding: "0 1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#021550", marginBottom: "1rem" }}>
          Frequently Asked Questions About Online Tutoring
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {onlineFaqs.map((item) => (
            <details
              key={item.q}
              style={{
                background: "#f8faff",
                border: "1px solid #e2e8f0",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
              }}
            >
              <summary style={{ fontWeight: 700, color: "#021550", cursor: "pointer" }}>
                {item.q}
              </summary>
              <p style={{ marginTop: "0.5rem", color: "#64748b", lineHeight: 1.6, fontSize: "0.95rem" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
