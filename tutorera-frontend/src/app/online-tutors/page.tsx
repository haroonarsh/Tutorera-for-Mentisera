import type { Metadata } from "next";
import TutorsExplorer from "@/components/Tutors/TutorsExplorer";
import { fetchTutors } from "@/lib/tutor-directory";
import type { FiltersState } from "@/types/tutor";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Find Verified Online Tutors Worldwide | 1-on-1 Live Lessons",
  description:
    "Connect with qualified, verified online tutors worldwide. Post your requirement, compare tutor rates in your currency, schedule flexible 1-on-1 sessions, and pay with secure platform payment protection.",
  alternates: { canonical: "/online-tutors" },
  openGraph: {
    title: "Find Verified Online Tutors Worldwide | TUTORERA",
    description:
      "Connect with qualified online tutors worldwide across Cambridge, IB, GCSE, and board curricula with transparent pricing.",
    url: `${SITE_URL}/online-tutors`,
  },
};

const onlineFaqs = [
  {
    q: "How does online tutoring work on TUTORERA?",
    a: "Students post their subject, curriculum, timezone, and preferred budget. Verified online tutors submit customized offers. Once you accept an offer, 1-on-1 interactive lessons take place via live interactive video and collaborative whiteboards.",
  },
  {
    q: "What curricula do online tutors cover?",
    a: "TUTORERA educators support Cambridge O/A Levels, British GCSE/IGCSE, International Baccalaureate (IB DP/MYP), American AP, Matric, FSc, and standardized tests such as IELTS, SAT, and MDCAT.",
  },
  {
    q: "In what currencies can I pay for online tutoring?",
    a: "You can view and agree on rates in major international currencies (AED, USD, GBP, SAR, PKR, etc.). All transactions are processed through secure TUTORERA platform payments with full satisfaction guarantees.",
  },
  {
    q: "What timezone scheduling is supported?",
    a: "Tutors set flexible availability across Middle East (GST), UK (GMT/BST), Pakistan (PKT), North America (EST/PST), and global timezones.",
  },
];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const value = (input: string | string[] | undefined) => (typeof input === "string" ? input : "");

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
        title="Find Verified Online Tutors Worldwide"
        subtitle={
          result.total
            ? `${result.total} verified online tutors ready for 1-on-1 virtual lessons`
            : "Browse verified online educators across international curricula and subjects"
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
