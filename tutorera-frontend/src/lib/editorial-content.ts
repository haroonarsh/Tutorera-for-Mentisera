import { estimateReadingTime } from "./blog-markdown";

export interface EditorialArticle {
  _id: string; title: string; slug: string; excerpt: string; metaDescription: string; content: string;
  coverImage: string; coverImageAlt: string;
  author: { name: string; url: string }; reviewer: { name: string; url: string };
  tags: string[]; category: string; featured: boolean; readingTime: string;
  createdAt: string; updatedAt: string;
}

const identity = {
  author: { name: "TUTORERA Editorial Team", url: "/editorial-policy" },
  reviewer: { name: "TUTORERA Platform Operations", url: "/content-review-policy" },
  createdAt: "2026-08-30T00:00:00.000Z", updatedAt: "2026-08-31T00:00:00.000Z", coverImage: "", coverImageAlt: "",
};

const STATIC_ARTICLE_SOURCES = [
  { _id: "trusted-tutor-guide", slug: "how-to-find-a-trusted-tutor-in-pakistan", title: "How to Find a Trusted Tutor in Pakistan: A Parent's Guide", excerpt: "A practical process for comparing tutor qualifications, teaching fit, safety, price, and verified reviews.", tags: ["parents", "safety", "guide"], category: "Parents & Safety", featured: true, content: `Finding the right tutor starts with a clear learning need, not a long list of names. Record the subject, curriculum, current level, target, preferred lesson mode, available times, and a sustainable hourly budget before comparing candidates.

**Check what has actually been verified**

Ask whether identity and academic documents were reviewed, and distinguish that check from teaching quality. On TUTORERA, an approved public profile means the required documents passed the platform review described in the Tutor Verification Standards. It is not a guarantee of future results.

**Compare relevant experience**

Prioritise experience with the student's exact curriculum and goal. A university qualification may be useful, but it does not replace clear explanations, suitable lesson planning, and familiarity with the relevant board or examination.

**Use evidence from the profile**

Compare subjects, levels, teaching mode, city, rate, education, experience, and reviews linked to completed platform bookings. Treat unsupported claims cautiously and ask how a typical lesson would work.

**Assess fit in the first session**

Agree on a specific first-lesson objective. Afterwards, ask whether the tutor diagnosed gaps, explained clearly, checked understanding, and set a useful next step.

**Keep in-person tuition safe**

For younger learners, use a shared household space with a responsible adult nearby. Keep booking and communication records on the platform, and report conduct that conflicts with the safety policy.

**Review progress, not promises**

Set a short review point after several sessions. Look for attendance, completed work, improved understanding, and progress against the agreed target.

**Frequently asked questions**

**How long does tutor verification take on TUTORERA?**

Most identity and document checks are completed within 24-48 hours of a tutor submitting a complete application, though academic document review can take longer during peak enrollment periods.

**Can I request a trial session before committing?**

Yes. Agree a specific first-lesson objective with the tutor, then assess whether they diagnosed gaps, explained clearly, and set a useful next step before booking further sessions.` },
  { _id: "online-home-comparison", slug: "online-vs-home-tuition-in-pakistan", title: "Online Tutoring vs Home Tuition in Pakistan", excerpt: "A balanced comparison of access, cost, safety, technology, and learning fit for Pakistani families.", tags: ["online tutoring", "home tuition", "comparison"], category: "Comparisons", featured: false, content: `Online and in-person tutoring can both work well. The better option depends on the learner, subject, available tutors, home environment, and technology.

**Access and tutor choice**

Online lessons let families compare tutors beyond their city and can improve access to specialised subjects. Home tuition can be practical for younger pupils or learners who benefit from direct supervision.

**Cost and travel**

Rates vary by tutor, subject, level, city, and experience. Online lessons may remove travel costs, but families should compare the actual advertised rate and applicable platform fees rather than assuming a fixed saving.

**Learning environment**

Online tuition needs a stable connection, working audio, a suitable device, and a quiet place. In-person tuition avoids some technology problems but requires a safe meeting space and travel reliability.

**Teaching methods**

Screen sharing, digital whiteboards, and shared documents suit many subjects. Practical work, handwriting support, and attention management may be easier face to face for some students.

**Safety and records**

Parents should supervise arrangements appropriately in either mode. In-person sessions for younger students should take place in a shared area. Platform records preserve a history of the tutoring relationship.

**How to decide**

Shortlist tutors with relevant curriculum experience, then use the first session to assess clarity, engagement, technology, punctuality, and whether the mode supports the student's needs.` },
  { _id: "parent-checklist", slug: "what-to-look-for-before-hiring-a-tutor-pakistan", title: "What Parents Should Check Before Hiring a Tutor in Pakistan", excerpt: "A due-diligence checklist covering credentials, curriculum fit, lesson plans, safeguarding, rates, and reviews.", tags: ["parents", "checklist", "verification"], category: "Parents & Safety", featured: true, content: `A tutor should be evaluated on evidence relevant to the student's needs. Use this checklist before agreeing to ongoing lessons.

**Identity and qualifications**

Confirm what the platform has verified. Read the qualification details and check that the tutor's claimed subject knowledge is appropriate for the level being taught.

**Curriculum experience**

Ask about direct experience with the student's board, syllabus, examination format, and current topic. General subject knowledge and curriculum-specific preparation are not always the same.

**Teaching plan**

Describe the learner's difficulties and goals. A credible response should explain how early sessions will diagnose gaps, what materials will be used, and how progress will be reviewed.

**Communication and boundaries**

Agree on lesson times, cancellations, homework, parent updates, and the approved communication channel. For minors and in-person lessons, follow platform safety guidance.

**Price and payment**

Confirm the displayed hourly rate, expected frequency, and applicable platform charges before booking. Keep payment and booking records.

**Reviews and fit**

Give more weight to detailed reviews connected to completed bookings. A first session remains important: qualifications and ratings cannot fully predict whether a tutor suits a learner.

**Ongoing review**

Agree on a measurable goal and a date to assess it. Evidence can include improved understanding, completed practice, school feedback, or examination performance.` },
];

export const STATIC_ARTICLES: EditorialArticle[] = STATIC_ARTICLE_SOURCES.map((a) => ({
  ...identity, ...a, metaDescription: a.excerpt, readingTime: estimateReadingTime(a.content),
}));

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";

const normalize = (a: Partial<EditorialArticle>): EditorialArticle => ({
  _id: a._id || a.slug || "article",
  title: a.title || "TUTORERA Guide",
  slug: a.slug || "",
  excerpt: a.excerpt || "Practical guidance from TUTORERA.",
  metaDescription: a.metaDescription || a.excerpt || "Practical guidance from TUTORERA.",
  content: a.content || "",
  coverImage: a.coverImage || "",
  coverImageAlt: a.coverImageAlt || "",
  author: a.author?.name ? { name: a.author.name, url: a.author.url || "/editorial-policy" } : identity.author,
  reviewer: identity.reviewer,
  tags: a.tags || [],
  category: a.category || "Guides",
  featured: Boolean(a.featured),
  readingTime: a.readingTime || estimateReadingTime(a.content || ""),
  createdAt: a.createdAt || identity.createdAt,
  updatedAt: a.updatedAt || a.createdAt || identity.updatedAt,
});

export interface EditorialArticleFilters {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
}

export interface EditorialArticlesResult {
  articles: EditorialArticle[];
  total: number;
  pages: number;
}

export async function getEditorialArticles(filters: EditorialArticleFilters = {}): Promise<EditorialArticlesResult> {
  const { page = 1, limit = 12, category, featured } = filters;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) params.set("category", category);
  if (featured) params.set("featured", "true");

  try {
    const r = await fetch(`${API_URL}/blogs?${params}`, { next: { revalidate: 900 } });
    if (!r.ok) return { articles: STATIC_ARTICLES, total: STATIC_ARTICLES.length, pages: 1 };
    const d = await r.json();
    // The list endpoint never returns `content` (by design - see blog.controller.ts),
    // so real posts must not be gated on content length here; that gate only makes
    // sense against the single-post endpoint, which does return full content.
    const useful = (Array.isArray(d.blogs) ? d.blogs : []).filter((a: Partial<EditorialArticle>) => a.slug && a.title);
    if (!useful.length) return { articles: STATIC_ARTICLES, total: STATIC_ARTICLES.length, pages: 1 };
    return { articles: useful.map(normalize), total: d.total ?? useful.length, pages: d.pages ?? 1 };
  } catch {
    return { articles: STATIC_ARTICLES, total: STATIC_ARTICLES.length, pages: 1 };
  }
}

export async function getEditorialArticle(slug: string): Promise<EditorialArticle | null> {
  const fallback = STATIC_ARTICLES.find((a) => a.slug === slug) || null;
  try {
    const r = await fetch(`${API_URL}/blogs/${encodeURIComponent(slug)}`, { next: { revalidate: 900 } });
    if (!r.ok) return fallback;
    const a = (await r.json()).blog;
    return a?.content?.trim().length >= 300 ? normalize(a) : fallback;
  } catch {
    return fallback;
  }
}

export interface EditorialCategory {
  category: string;
  count: number;
}

// Shared by every place that links to/reads a category route, so "Parents &
// Safety" consistently becomes "parents-safety" everywhere rather than each
// call site inventing its own (subtly different) slugification.
export function categoryToSlug(category: string | null | undefined): string {
  return (category || "guides").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getEditorialCategories(): Promise<EditorialCategory[]> {
  try {
    const r = await fetch(`${API_URL}/blogs/categories`, { next: { revalidate: 900 } });
    if (!r.ok) throw new Error("categories fetch failed");
    const d = await r.json();
    if (Array.isArray(d.categories) && d.categories.length) return d.categories;
    throw new Error("empty categories");
  } catch {
    // Derived from the static fallback articles' own categories, so the
    // sidebar/category pages still work when the API is unreachable.
    const counts = new Map<string, number>();
    for (const article of STATIC_ARTICLES) counts.set(article.category, (counts.get(article.category) || 0) + 1);
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }
}

export interface BlogSidebarData {
  categories: EditorialCategory[];
  featuredPosts: EditorialArticle[];
  recentPosts: EditorialArticle[];
  searchIndex: { slug: string; title: string; excerpt: string }[];
}

// Shared by /blog, /blog/[slug], and /blog/category/[category] so the
// sidebar's data-fetching logic (and its fallbacks) lives in one place.
export async function getBlogSidebarData(): Promise<BlogSidebarData> {
  const [categories, featuredResult, recentResult] = await Promise.all([
    getEditorialCategories(),
    getEditorialArticles({ featured: true, limit: 5 }),
    getEditorialArticles({ limit: 20 }), // used both for "recently updated" and the search index
  ]);

  const featuredPosts = featuredResult.articles.length
    ? featuredResult.articles.slice(0, 5)
    : [...recentResult.articles].slice(0, 5); // fall back to most recent when fewer than the desired count are flagged featured

  const recentPosts = [...recentResult.articles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const searchIndex = recentResult.articles.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt }));

  return { categories, featuredPosts, recentPosts, searchIndex };
}
