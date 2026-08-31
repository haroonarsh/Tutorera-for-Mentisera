import type { Metadata } from "next";
import Link from "next/link";
import { fetchTutor } from "@/lib/tutor-directory";
import { SITE_URL } from "@/lib/site";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) return { title: "Tutor Profile", robots: { index: false, follow: true } };

  const name = tutor.user?.name || tutor.fullName || "Tutor";
  const subjects = tutor.subjects?.slice(0, 2).join(" & ") || "Private";
  const city = tutor.city || tutor.user?.city || "Pakistan";
  const title = `${name} – ${subjects} Tutor in ${city}`;
  const description = `Book ${name}, a verified ${subjects} tutor in ${city}. View experience, teaching modes, availability, student ratings, and hourly rate on TUTORERA.`;
  const path = `/tutors/${id}`;
  return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | TUTORERA®`, description, url: path, type: "profile", images: tutor.user?.avatar ? [tutor.user.avatar] : ["/og-image.png"] } };
}

export default async function TutorProfileLayout({ children, params }: Props) {
  const { id } = await params;
  const tutor = await fetchTutor(id);
  if (!tutor) return children;

  const name = tutor.user?.name || tutor.fullName || "Tutor";
  const url = `${SITE_URL}/tutors/${id}`;
  const schema = {
    "@context": "https://schema.org", "@type": "ProfilePage", "@id": `${url}/#profile`, url,
    mainEntity: {
      "@type": "Person", name, image: tutor.user?.avatar || undefined, description: tutor.bio || undefined,
      address: tutor.city ? { "@type": "PostalAddress", addressLocality: tutor.city, addressCountry: "PK" } : undefined,
      knowsAbout: tutor.subjects, alumniOf: tutor.education?.map((item) => ({ "@type": "EducationalOrganization", name: item.institution })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tutors", item: `${SITE_URL}/tutors` },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem 1.5rem 0", color: "#6b7280", fontSize: ".875rem" }}><Link href="/tutors" style={{ color: "#2563eb" }}>Tutors</Link> <span aria-hidden="true">/</span> {name}<p style={{ marginTop: ".5rem" }}>{name} teaches {tutor.subjects?.join(", ") || "multiple subjects"} in {tutor.city || "Pakistan"} and offers {tutor.teachingMode === "both" ? "online and in-person" : tutor.teachingMode} lessons.</p></nav>{children}</>;
}
