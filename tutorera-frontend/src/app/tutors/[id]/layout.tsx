import type { Metadata } from "next";
import { fetchTutor, tutorProfileSlug } from "@/lib/tutor-directory";
import { SITE_URL } from "@/lib/site";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

function formatName(raw?: string): string {
  if (!raw) return "Tutor";
  return raw
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) return { title: "Tutor Profile", robots: { index: false, follow: true } };

  const name = formatName(tutor.user?.name || tutor.fullName);
  const subjects = tutor.subjects?.slice(0, 2).join(" & ") || "Academic";
  const country = tutor.countryName || tutor.user?.countryName || (tutor.countryCode === "PK" ? "Pakistan" : tutor.countryCode) || "Verified Educator";
  const city = tutor.city || tutor.user?.city;
  const locationStr = tutor.teachingMode === "online"
    ? (city ? `${city} · Online Worldwide` : "Online Worldwide")
    : (city ? `${city}, ${country}` : country);

  const title = `${name} – ${subjects} Tutor (${locationStr})`;
  const description = `Book ${name}, a verified ${subjects} tutor (${locationStr}). View qualifications, curricula, student ratings, and transparent hourly rates on TUTORERA.`;
  const path = `/tutors/${tutorProfileSlug(tutor)}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | TUTORERA®`,
      description,
      url: path,
      type: "profile",
      images: tutor.user?.avatar ? [tutor.user.avatar] : ["/og-image.png"],
    },
  };
}

export default async function TutorProfileLayout({ children, params }: Props) {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) return children;

  const name = formatName(tutor.user?.name || tutor.fullName);
  const url = `${SITE_URL}/tutors/${tutorProfileSlug(tutor)}`;
  const countryCode = tutor.countryCode || tutor.user?.countryCode || "PK";
  const countryName = tutor.countryName || tutor.user?.countryName || (countryCode === "PK" ? "Pakistan" : countryCode);
  const city = tutor.city || tutor.user?.city;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}/#profile`,
    url,
    mainEntity: {
      "@type": "Person",
      name,
      image: tutor.user?.avatar || undefined,
      description: tutor.bio || undefined,
      address: city
        ? {
            "@type": "PostalAddress",
            addressLocality: city,
            addressCountry: countryCode,
          }
        : undefined,
      knowsAbout: [
        ...(tutor.subjects || []),
        ...(tutor.curricula || []),
      ],
      alumniOf: tutor.education?.map((item) => ({
        "@type": "EducationalOrganization",
        name: item.institution,
      })),
      makesOffer: {
        "@type": "Offer",
        price: tutor.hourlyRate || 0,
        priceCurrency: tutor.currency || "PKR",
        availability: "https://schema.org/InStock",
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tutors", item: `${SITE_URL}/tutors` },
        ...(countryCode && countryName
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: countryName,
                item: `${SITE_URL}/${countryCode.toLowerCase()}/tutors`,
              },
              { "@type": "ListItem", position: 4, name, item: url },
            ]
          : [{ "@type": "ListItem", position: 3, name, item: url }]),
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
