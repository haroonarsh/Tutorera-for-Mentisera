import { Metadata } from "next";
import { Suspense } from "react";
import TuitionRequestsClient from "./TuitionRequestsClient";

interface Props {
  params: Promise<{ country: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  pk: "Pakistan",
  ae: "United Arab Emirates",
  gb: "United Kingdom",
};

export async function generateStaticParams() {
  return [{ country: "pk" }, { country: "ae" }, { country: "gb" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryName = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();

  return {
    title: `Student Tuition Requests in ${countryName}`,
    description: `Browse active tuition requests from students in ${countryName}. Post your requirement and receive offers from verified tutors. Online and home tuition available.`,
    alternates: {
      canonical: `/tuition-requests/${country}`,
    },
    openGraph: {
      title: `Active Tuition Requests in ${countryName} | TUTORERA`,
      description: `Real students in ${countryName} are looking for tutors. Post your tuition requirement and get matched with verified tutors.`,
      type: "website",
    },
  };
}

export default async function CountryTuitionRequestsPage({ params }: Props) {
  const { country } = await params;
  const countryCode = country.toUpperCase();
  const countryName = COUNTRY_NAMES[country.toLowerCase()] || countryCode;

  return (
    <Suspense fallback={<main style={{ padding: "4rem 1.5rem", textAlign: "center" }}><p>Loading tuition requests for {countryName}...</p></main>}>
      <TuitionRequestsClient countryCode={countryCode} countryName={countryName} />
    </Suspense>
  );
}
