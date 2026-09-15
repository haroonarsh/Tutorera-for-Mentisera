import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MARKETS, getMarketByRoute } from "@/lib/markets";
import { getCountryByCode } from "@/lib/location";
import { SITE_URL } from "@/lib/site";

interface Props { params: Promise<{ countryCode: string }> }

export function generateStaticParams() {
  return Object.values(MARKETS).map((market) => ({ countryCode: market.route }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params;
  if (countryCode.toLowerCase() === "gb") return {};
  const market = getMarketByRoute(countryCode);
  if (!market) return { robots: { index: false, follow: true } };
  const canonical = `/${market.route}`;
  const title = `Find Tutors & Tutoring Opportunities in ${market.countryName}`;
  const description = `TUTORERA is a student-led tutoring marketplace in ${market.countryName}. Post your requirement and preferred budget in ${market.currency}, compare tutor offers, and choose your tutor.`;
  return {
    title,
    description,
    alternates: { canonical, languages: { [market.locale]: `${SITE_URL}${canonical}`, "x-default": SITE_URL } },
    openGraph: { title, description, url: `${SITE_URL}${canonical}`, locale: market.locale.replace("-", "_") },
  };
}

export default async function MarketPage({ params }: Props) {
  const { countryCode } = await params;
  if (countryCode.toLowerCase() === "gb") permanentRedirect("/uk");
  const market = getMarketByRoute(countryCode);
  if (!market) notFound();
  const country = getCountryByCode(market.isoCountryCode);
  if (!country) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `TUTORERA ${market.countryName}`,
    url: `${SITE_URL}/${market.route}`,
    inLanguage: market.locale,
    about: {
      "@type": "Service",
      name: `TUTORERA tutoring marketplace in ${market.countryName}`,
      areaServed: { "@type": "Country", name: market.countryName },
      provider: { "@id": `${SITE_URL}/#organization` },
    },
  };

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <p style={{ fontWeight: 700, color: "#0329b2" }}>{market.status === "LIVE" ? "Live market" : "Discovery beta"} · {market.currency} ({market.currencySymbol})</p>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", lineHeight: 1.05, color: "#021550", maxWidth: 900 }}>
        Find Tutors & Tutoring Opportunities in {market.countryName}
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 820 }}>
        Students post what they need and their preferred budget in {market.currency}. Eligible tutors can respond with offers or counter-offers. Students compare tutors and choose who they want to learn with.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "1.5rem 0 2.5rem" }}>
        <Link href="/post-request" style={{ padding: "0.8rem 1.2rem", borderRadius: 10, background: "#0329b2", color: "white", textDecoration: "none", fontWeight: 700 }}>Post a Tuition Request</Link>
        <Link href={`/${market.route}/tutors`} style={{ padding: "0.8rem 1.2rem", borderRadius: 10, border: "1px solid #0329b2", color: "#0329b2", textDecoration: "none", fontWeight: 700 }}>Browse Tutors</Link>
      </div>
      <section>
        <h2>How this market works</h2>
        <p><strong>Currency:</strong> Student budgets and market offers use {market.currency} ({market.currencySymbol}). Existing bookings retain their original transaction currency even if the user later changes market.</p>
        <p><strong>Online Tuition:</strong> {market.onlineTuitionEnabled ? "Available worldwide; online tutors are not restricted to the student's country." : "Not currently enabled."}</p>
        <p><strong>Home Tuition:</strong> {market.homeTuitionEnabled ? `Available locally in ${market.countryName}, subject to location and verification requirements.` : "Not yet enabled for this market."}</p>
        <p><strong>Checkout:</strong> {market.checkoutEnabled ? `Enabled for the ${market.countryName} market using supported payment methods.` : "Not yet live. TUTORERA will not present a payment method as available until market checkout is activated."}</p>
        <p><Link href={market.legalSchedule}>Read the {market.countryName} legal schedule</Link></p>
      </section>
      {country.curricula?.length > 0 && <section style={{ marginTop: "2.5rem" }}><h2>Relevant curricula</h2><p>{country.curricula.join(" · ")}</p></section>}
    </main>
  );
}
