import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { resolveCountry, liveCountryCodeParams } from "@/lib/geo-server";
import HeroMarketplace from "@/components/marketplace/HeroMarketplace";
import HomeOnlineTuitionCards from "@/components/marketplace/HomeOnlineTuitionCards";
import TopRequestsSection from "@/components/TopRequestsSection";
import { fetchTutors } from "@/lib/tutor-directory";

interface Props {
  params: Promise<{ countryCode: string }>;
}

export async function generateStaticParams() {
  return liveCountryCodeParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params;
  const country = await resolveCountry(countryCode);
  if (!country) return { title: "Country Not Found" };

  const title = `Find Tutors & Teaching Opportunities in ${country.name} | TUTORERA`;
  const description = `Connect with verified tutors and students in ${country.name}. Post your requirements or find teaching jobs in ${country.currency}.`;
  const canonical = `/${countryCode.toLowerCase()}`;

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

export default async function CountryLandingPage({ params }: Props) {
  const { countryCode } = await params;
  const country = await resolveCountry(countryCode);
  if (!country) notFound();

  // Only surface cities where TUTORERA actually has tutor supply - the geo
  // dataset lists every city in the country regardless of whether anyone
  // teaches there yet, and linking to an empty filtered search is a thin,
  // untrustworthy page for both users and crawlers.
  const candidateCities = (country.cities || []).slice(0, 15);
  const cityCounts = await Promise.all(
    candidateCities.map((city) => fetchTutors({ city: city.name, countryCode: country.code }, 1).then((r) => r.total))
  );
  const citiesWithSupply = candidateCities
    .map((city, i) => ({ city, total: cityCounts[i] }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{
        background: "#021550",
        color: "white",
        textAlign: "center",
        padding: "0.75rem",
        fontSize: "0.85rem",
        fontWeight: 700
      }}>
        You are viewing TUTORERA for {country.name}
      </div>

      <HeroMarketplace />
      
      <HomeOnlineTuitionCards />

      <section style={{ maxWidth: 1120, margin: "4rem auto", padding: "0 1.5rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#021550", marginBottom: "1rem" }}>
          Explore Popular Areas in {country.name}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {citiesWithSupply.length > 0 ? (
            citiesWithSupply.map(({ city, total }) => (
              <Link
                key={city.id || city.name}
                href={`/${country.code.toLowerCase()}/tutors?city=${encodeURIComponent(city.name)}`}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#0329b2",
                  textDecoration: "none",
                }}
              >
                Tutors in {city.name} ({total})
              </Link>
            ))
          ) : (
            <p style={{ color: "#64748b" }}>Available nationwide online. Local in-person tutors are onboarding in {country.name} - check back soon.</p>
          )}
        </div>
      </section>

      <TopRequestsSection />
    </div>
  );
}
