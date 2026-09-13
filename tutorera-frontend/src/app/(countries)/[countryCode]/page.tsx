import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { resolveCountry, liveCountryCodeParams } from "@/lib/geo-server";
import HeroMarketplace from "@/components/marketplace/HeroMarketplace";
import HomeOnlineTuitionCards from "@/components/marketplace/HomeOnlineTuitionCards";
import TopRequestsSection from "@/components/TopRequestsSection";

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
          {country.cities && country.cities.length > 0 ? (
            country.cities.map((city) => {
              const citySlug = city.name.toLowerCase().replace(/\s+/g, "-");
              return (
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
                  Tutors in {city.name}
                </Link>
              );
            })
          ) : (
            <p style={{ color: "#64748b" }}>Available nationwide online.</p>
          )}
        </div>
      </section>

      <TopRequestsSection />
    </div>
  );
}
