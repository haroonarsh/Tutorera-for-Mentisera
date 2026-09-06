import { Metadata } from "next";
import TuitionRequestsClient from "./TuitionRequestsClient";

interface Props {
  params: Promise<{ country: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  pk: "Pakistan",
  ae: "United Arab Emirates",
  sa: "Saudi Arabia",
  gb: "United Kingdom",
  us: "United States",
  ca: "Canada",
  au: "Australia",
  qa: "Qatar",
  om: "Oman",
  kw: "Kuwait",
  bh: "Bahrain",
  in: "India",
  my: "Malaysia",
  sg: "Singapore",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryName = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();

  return {
    title: `Student Tuition Requests in ${countryName} | TUTORERA Marketplace`,
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

  return <TuitionRequestsClient countryCode={countryCode} countryName={countryName} />;
}
