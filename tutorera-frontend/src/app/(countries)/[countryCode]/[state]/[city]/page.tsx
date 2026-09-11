import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountryByCode } from "@/lib/location";
import { SITE_URL } from "@/lib/site";
import TutorsExplorer from "@/components/Tutors/TutorsExplorer";
import { fetchTutors } from "@/lib/tutor-directory";

interface Props {
  params: Promise<{ countryCode: string; state: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatName(slug: string) {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode, state, city } = await params;
  const country = getCountryByCode(countryCode);
  if (!country) return { title: "TUTORERA" };

  const cityName = formatName(city);
  const stateName = formatName(state);

  const title = `Top Tutors in ${cityName}, ${stateName} | ${country.name} | TUTORERA`;
  const description = `Find verified online and local home tutors in ${cityName}, ${stateName}. Post your tuition requirements or find teaching opportunities today.`;
  const canonical = `/${countryCode.toLowerCase()}/${state.toLowerCase()}/${city.toLowerCase()}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

export default async function StateCityLandingPage({ params, searchParams }: Props) {
  const { countryCode, state, city } = await params;
  const country = getCountryByCode(countryCode);
  if (!country) notFound();

  const cityName = formatName(city);
  const stateName = formatName(state);

  const queryParams = await searchParams;
  
  const result = await fetchTutors(
    {
      city: cityName,
      countryCode: country.code,
      country: country.name,
    },
    12
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{
        background: "#0329b2",
        color: "white",
        textAlign: "center",
        padding: "1rem",
        marginBottom: "2rem"
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0 }}>
          Tutors in {cityName}, {stateName}
        </h1>
        <p style={{ opacity: 0.9, marginTop: "0.5rem" }}>
          Find the best local and online tutors serving {cityName}.
        </p>
      </div>

      <div style={{ padding: "0 1.5rem" }}>
        <TutorsExplorer
          initialTutors={result.tutors}
          initialPagination={{
            total: result.total,
            page: result.page,
            pages: result.pages,
            limit: 12,
          }}
          initialFilters={{ city: cityName, country: country.name }}
          title={`Verified Tutors for ${cityName}`}
          subtitle={`${result.total} tutors available for hire`}
        />
      </div>
    </div>
  );
}
