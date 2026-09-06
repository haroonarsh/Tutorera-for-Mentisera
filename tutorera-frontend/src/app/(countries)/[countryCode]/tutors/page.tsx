import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TutorsExplorer from "@/components/Tutors/TutorsExplorer";
import { fetchTutors } from "@/lib/tutor-directory";
import { getCountryByCode, COUNTRIES } from "@/lib/countries";
import type { FiltersState } from "@/types/tutor";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ countryCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const value = (input: string | string[] | undefined) => (typeof input === "string" ? input : "");

export function generateStaticParams() {
  return [
    { countryCode: "pk" },
    { countryCode: "ae" },
    { countryCode: "gb" },
    { countryCode: "sa" },
    { countryCode: "us" },
    { countryCode: "ca" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params;
  const country = getCountryByCode(countryCode);
  if (!country) return { title: "Tutors Directory", robots: { index: false, follow: true } };

  const title = `Find Verified Tutors in ${country.name} | Online & Home Tuition`;
  const description = `Connect with verified tutors in ${country.name} (${country.currency}). Compare rates, explore ${country.curricula.slice(0, 3).join(", ")} curricula, and book with secure escrow.`;
  const canonical = `/${countryCode.toLowerCase()}/tutors`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | TUTORERA`,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

export default async function CountryTutorsPage({ params, searchParams }: Props) {
  const { countryCode } = await params;
  const country = getCountryByCode(countryCode);
  if (!country) notFound();

  const queryParams = await searchParams;
  const initialFilters: Partial<FiltersState> = {
    search: value(queryParams.search),
    country: country.name,
    city: value(queryParams.city),
    level: value(queryParams.level),
    teachingMode: value(queryParams.teachingMode),
    minPrice: value(queryParams.minPrice),
    maxPrice: value(queryParams.maxPrice),
    minRating: value(queryParams.minRating),
    sortBy: value(queryParams.sortBy) || "rating",
  } as Partial<FiltersState>;

  const subject = value(queryParams.subject);
  if (subject && !initialFilters.search) initialFilters.search = subject;

  const result = await fetchTutors(
    {
      search: initialFilters.search,
      city: initialFilters.city,
      countryCode: country.code,
      country: country.name,
      level: initialFilters.level,
      subject,
      teachingMode: initialFilters.teachingMode,
      minPrice: initialFilters.minPrice,
      maxPrice: initialFilters.maxPrice,
      minRating: initialFilters.minRating,
    },
    12
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Verified Tutors in ${country.name}`,
    description: `Find verified online and home tutors in ${country.name} across ${country.curricula.join(", ")}.`,
    url: `${SITE_URL}/${countryCode.toLowerCase()}/tutors`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tutors", item: `${SITE_URL}/tutors` },
        { "@type": "ListItem", position: 3, name: country.name, item: `${SITE_URL}/${countryCode.toLowerCase()}/tutors` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        title={`Find Verified Tutors in ${country.name}`}
        subtitle={
          result.total
            ? `${result.total} verified educators available in ${country.name} (${country.currency})`
            : `Browse verified educators in ${country.name} for ${country.curricula.slice(0, 3).join(", ")} and academic subjects`
        }
      />
      {country.cities && country.cities.length > 0 && (
        <section style={{ maxWidth: 1120, margin: "2rem auto 4rem", padding: "0 1.5rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#021550", marginBottom: "1rem" }}>
            Explore In-Person & Home Tuition Cities in {country.name}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {country.cities.map((city) => (
              <a
                key={city.id || city.name}
                href={`/${countryCode.toLowerCase()}/tutors?city=${encodeURIComponent(city.name)}`}
                style={{
                  background: "#f8faff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "0.45rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#0329b2",
                  textDecoration: "none",
                }}
              >
                {city.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
