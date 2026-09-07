import { Metadata } from "next";
import TuitionRequestsClient from "../../TuitionRequestsClient";

interface Props {
  params: Promise<{ country: string; city: string; subject: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  pk: "Pakistan",
  ae: "United Arab Emirates",
  sa: "Saudi Arabia",
  gb: "United Kingdom",
  us: "United States",
};

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

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city, subject } = await params;
  const countryName = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();
  const cityDisplay = CITY_DISPLAY_NAMES[city.toLowerCase()] || titleCaseSlug(city);
  const subjectDisplay = titleCaseSlug(subject);

  return {
    title: `${subjectDisplay} Tuition Requests in ${cityDisplay}, ${countryName} | TUTORERA`,
    description: `Browse privacy-safe active ${subjectDisplay} tuition requests in ${cityDisplay}, ${countryName}. Students post requirements; verified tutors send structured offers.`,
    alternates: {
      canonical: `/tuition-requests/${country}/${city}/${subject}`,
    },
    openGraph: {
      title: `${subjectDisplay} Tutor Demand in ${cityDisplay} | TUTORERA`,
      description: `Real student demand for ${subjectDisplay} tutoring in ${cityDisplay}. No phone numbers, emails, exact addresses, or minor identities are published.`,
      type: "website",
    },
  };
}

export default async function SubjectCityTuitionRequestsPage({ params }: Props) {
  const { country, city, subject } = await params;
  const countryName = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();
  const cityDisplay = CITY_DISPLAY_NAMES[city.toLowerCase()] || titleCaseSlug(city);
  const subjectDisplay = titleCaseSlug(subject);

  return (
    <TuitionRequestsClient
      countryCode={country.toUpperCase()}
      countryName={countryName}
      cityName={cityDisplay}
      subjectName={subjectDisplay}
    />
  );
}
