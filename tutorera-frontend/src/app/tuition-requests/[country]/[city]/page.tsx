import { Metadata } from "next";
import TuitionRequestsClient from "../TuitionRequestsClient";

interface Props {
  params: Promise<{ country: string; city: string }>;
}

const CITY_DISPLAY_NAMES: Record<string, string> = {
  lahore: "Lahore",
  islamabad: "Islamabad & Rawalpindi",
  karachi: "Karachi",
  faisalabad: "Faisalabad",
  multan: "Multan",
  peshawar: "Peshawar",
  quetta: "Quetta",
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  riyadh: "Riyadh",
  jeddah: "Jeddah",
  london: "London",
  manchester: "Manchester",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params;
  const citySlug = city.toLowerCase().replace(/-/g, " ");
  const cityDisplay = CITY_DISPLAY_NAMES[city.toLowerCase()] || citySlug;
  const countryCode = country.toUpperCase();
  const countryNames: Record<string, string> = {
    pk: "Pakistan",
    ae: "United Arab Emirates",
    sa: "Saudi Arabia",
    gb: "United Kingdom",
    us: "United States",
  };
  const countryName = countryNames[country.toLowerCase()] || countryCode;

  return {
    title: `Student Tuition Requests in ${cityDisplay}, ${countryName} | TUTORERA`,
    description: `Browse active tuition requests from students in ${cityDisplay}, ${countryName}. Post your requirement and receive offers from verified tutors.`,
    alternates: {
      canonical: `/tuition-requests/${country}/${city}`,
    },
    openGraph: {
      title: `Tuition Requests in ${cityDisplay}, ${countryName} | TUTORERA`,
      description: `Real students in ${cityDisplay} are looking for tutors. Post your tuition requirement and get matched with verified tutors.`,
      type: "website",
    },
  };
}

export default async function CityTuitionRequestsPage({ params }: Props) {
  const { country, city } = await params;
  const citySlug = city.toLowerCase().replace(/-/g, " ");
  const cityDisplay = CITY_DISPLAY_NAMES[city.toLowerCase()] || citySlug;
  const countryCode = country.toUpperCase();
  const countryNames: Record<string, string> = {
    pk: "Pakistan",
    ae: "United Arab Emirates",
    sa: "Saudi Arabia",
    gb: "United Kingdom",
    us: "United States",
  };
  const countryName = countryNames[country.toLowerCase()] || countryCode;

  return <TuitionRequestsClient countryCode={countryCode} countryName={countryName} cityName={cityDisplay} />;
}
