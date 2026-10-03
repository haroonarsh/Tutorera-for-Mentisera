import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { getEditorialArticle, categoryToSlug } from "@/lib/editorial-content";
import { extractFaqPairs } from "@/lib/blog-markdown";

// Institutional author identities currently in use. When article.author.name
// matches one of these, the Article's author is emitted as @type Organization
// (which is accurate — these guides are collective editorial output). Any
// other name is a human writer and gets @type Person with the author URL as
// the stable identifier, so the Person is a real graph node Google can
// resolve, not a misrepresented organization. Add future institutional
// identities here when they ship, not with heuristic string matching.
const INSTITUTIONAL_AUTHORS = new Set<string>([
  "TUTORERA Editorial Team",
  "TUTORERA Platform Operations",
]);

function authorSchema(name: string, url: string) {
  const absoluteUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  if (INSTITUTIONAL_AUTHORS.has(name)) {
    return { "@type": "Organization", name, url: absoluteUrl };
  }
  // Person path: @id anchors the Person so repeated articles by the same
  // author collapse to one graph node across pages; `url` keeps the
  // author-page link; `worksFor` ties the human to the TUTORERA org
  // (@id reference to the global Organization in layout.tsx).
  return {
    "@type": "Person",
    "@id": `${absoluteUrl}#person`,
    name,
    url: absoluteUrl,
    worksFor: { "@id": `${SITE_URL}/#organization` },
  };
}

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

  const authorName = article?.author.name || "TUTORERA Editorial Team";
  const authorUrl = article?.author.url || "/editorial-policy";
  const reviewerName = article?.reviewer.name || "TUTORERA Platform Operations";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: article?.metaDescription || article?.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: article?.createdAt,
    dateModified: article?.updatedAt,
    // Author type is now derived from the name — institutional sources
    // emit Organization (unchanged); any override to a human writer emits
    // Person with the author's URL as a stable graph identifier. The
    // reviewer stays Organization because content review is always a
    // platform-operations activity, not a single named reviewer.
    author: authorSchema(authorName, authorUrl),
    reviewedBy: { "@type": "Organization", name: reviewerName, url: `${SITE_URL}/content-review-policy` },
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
