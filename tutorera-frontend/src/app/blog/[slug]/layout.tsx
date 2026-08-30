import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const titles: Record<string, string> = {
  "how-to-find-a-trusted-tutor-in-pakistan": "How to Find a Trusted Tutor in Pakistan",
  "online-vs-home-tuition-in-pakistan": "Online Tutoring vs Home Tuition in Pakistan",
  "what-to-look-for-before-hiring-a-tutor-pakistan": "What to Look for Before Hiring a Tutor in Pakistan",
};
type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };
const titleFor = (slug: string) => titles[slug] || slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params; const title = titleFor(slug); const path = `/blog/${slug}`;
  return { title, description: `${title}. Practical guidance for students and parents from TUTORERA Pakistan.`, alternates: { canonical: path }, openGraph: { type: "article", title, url: path, images: ["/og-image.png"] } };
}

export default async function Layout({ children, params }: Props) {
  const { slug } = await params; const title = titleFor(slug); const url = `${SITE_URL}/blog/${slug}`;
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: title, url, mainEntityOfPage: url, author: { "@type": "Organization", name: "TUTORERA Editorial Team", url: `${SITE_URL}/editorial-policy` }, publisher: { "@id": `${SITE_URL}/#organization` }, image: `${SITE_URL}/og-image.png` };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}</>;
}
