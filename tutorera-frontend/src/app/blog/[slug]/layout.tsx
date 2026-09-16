import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { getEditorialArticle, categoryToSlug } from "@/lib/editorial-content";
import { extractFaqPairs } from "@/lib/blog-markdown";

const titles: Record<string, string> = {
  "how-to-find-a-trusted-tutor-in-pakistan": "How to Find a Trusted Tutor in Pakistan",
  "online-vs-home-tuition-in-pakistan": "Online Tutoring vs Home Tuition in Pakistan",
  "what-to-look-for-before-hiring-a-tutor-pakistan": "What to Look for Before Hiring a Tutor in Pakistan",
};
type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };
const titleFor = (slug: string) => titles[slug] || slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getEditorialArticle(slug);
  const title = article?.title || titleFor(slug);
  const path = `/blog/${slug}`;
  return {
    title,
    description: article?.metaDescription || article?.excerpt || `${title}. Practical guidance for students and parents from TUTORERA Pakistan.`,
    alternates: { canonical: path },
    openGraph: { type: "article", title, url: path, images: [article?.coverImage || "/og-image.png"] },
  };
}

export default async function Layout({ children, params }: Props) {
  const { slug } = await params;
  const article = await getEditorialArticle(slug);
  const title = article?.title || titleFor(slug);
  const url = `${SITE_URL}/blog/${slug}`;
  const category = article?.category || "Guides";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: article?.metaDescription || article?.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: article?.createdAt,
    dateModified: article?.updatedAt,
    // Content is institutionally authored and reviewed, not written by a
    // named individual - Organization correctly reflects that, rather than
    // a Person + sameAs that would misrepresent how these guides are made.
    author: { "@type": "Organization", name: article?.author.name || "TUTORERA Editorial Team", url: `${SITE_URL}${article?.author.url || "/editorial-policy"}` },
    reviewedBy: { "@type": "Organization", name: article?.reviewer.name || "TUTORERA Platform Operations", url: `${SITE_URL}/content-review-policy` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    image: article?.coverImage ? `${SITE_URL}${article.coverImage}` : `${SITE_URL}/og-image.png`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: category, item: `${SITE_URL}/blog/category/${categoryToSlug(category)}` },
      { "@type": "ListItem", position: 4, name: title, item: url },
    ],
  };

  const faqPairs = article ? extractFaqPairs(article.content) : [];
  const faqSchema = faqPairs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqPairs.map((pair) => ({
          "@type": "Question",
          name: pair.question,
          acceptedAnswer: { "@type": "Answer", text: pair.answer },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {children}
    </>
  );
}
