import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TuitionRequestsClient from "./TuitionRequestsClient";
import { liveCountryCodeParams, resolveCountry } from "@/lib/geo-server";

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return (await liveCountryCodeParams()).map(({ countryCode }) => ({ country: countryCode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const market = await resolveCountry(country);
  if (!market) return { title: "Tuition Requests", robots: { index: false, follow: true } };
  const countryName = market.name;
  const canonical = `/tuition-requests/${market.code.toLowerCase()}`;

  return {
    title: `Student Tuition Requests in ${countryName}`,
    description: `Browse active tuition requests from students in ${countryName}. Post your requirement and receive offers from verified tutors. Online and home tuition available.`,
    alternates: {
      canonical,
    },
    robots: { index: false, follow: true },
    openGraph: {
      title: `Active Tuition Requests in ${countryName} | TUTORERA`,
      description: `Real students in ${countryName} are looking for tutors. Post your tuition requirement and get matched with verified tutors.`,
      type: "website",
    },
  };
}

export default async function CountryTuitionRequestsPage({ params }: Props) {
  const { country } = await params;
  const market = await resolveCountry(country);
  if (!market) notFound();
  const countryCode = market.code;
  const countryName = market.name;

  return (
    <Suspense fallback={<main style={{ padding: "4rem 1.5rem", textAlign: "center" }}><p>Loading tuition requests for {countryName}...</p></main>}>
      <TuitionRequestsClient countryCode={countryCode} countryName={countryName} />
    </Suspense>
  );
}
