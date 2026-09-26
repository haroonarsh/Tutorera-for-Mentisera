import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CITIES, LEVELS, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS, fetchSeoInventory, fetchTutors, tutorProfileSlug } from "@/lib/tutor-directory";
import { getEditorialArticles, getEditorialCategories, categoryToSlug } from "@/lib/editorial-content";
import { assessTutorSeoQuality } from "@/lib/tutor-seo";

const routes = [
  "", "online-tutors", "about", "become-a-tutor", "blog", "business-model", "contact", "coverage", "first-session-guarantee", "team",
  "help", "help/for-parents", "help/for-tutors", "how-it-works", "how-tutor-offers-work", "levels", "locations", "pricing",
  "payment-process", "refund-policy", "safety-policy", "services", "student-journey", "subjects", "tutors", "terms", "privacy", "complaint-process", "cancellation-policy",
  "tutor-verification-standards", "in-person-home-tuition-terms", "review-policy", "editorial-policy", "academic-standards",
  "content-review-policy", "research-methodology", "tutor-screening-policy", "governance",
  "tuition-requests",
];

const TARGET_COUNTRIES = ["pk", "ae", "gb"] as const;
const HOME_TUTOR_CITY_SLUGS = ["lahore", "islamabad", "karachi"] as const;

// A single sitemap file supports up to 50,000 URLs (the sitemaps.org / Google limit).
// Splitting the tutors sitemap into multiple generateSitemaps() ids beyond the original
// 4 was tried and hits a reproducible crash in this Next.js version's multi-sitemap
// route matcher (a bare `a.startsWith is not a function` inside the framework's compiled
// [__metadata_id__] route, independent of id naming/count) - confirmed by bisecting back
// to the unmodified 4-id baseline, which builds cleanly every time. Rather than fight a
// framework bug, we raise the single tutors-sitemap cap well below the real 50k ceiling,
// which comfortably covers realistic near-term growth without hitting that bug at all.
const TUTOR_SITEMAP_CAP = 20000;

export async function generateSitemaps() {
  return [
    { id: 'core' },
    { id: 'tutors' },
  ];
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(); // In the future this should come from database max(updatedAt)

  if (id === 'core') {
    const inventory = await fetchSeoInventory();
    const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
      url: `${SITE_URL}/${route}`,
      lastModified,
      changeFrequency: route === "" || route === "tutors" || route === "online-tutors" ? "daily" : "monthly",
      priority: route === "" ? 1 : route === "tutors" || route === "online-tutors" ? 0.9 : 0.7,
    }));
    
    // Do not publish an indexable directory just because a location/subject
    // exists in a lookup table. Three public profiles is the shared minimum
    // inventory threshold for a standalone commercial landing page.
    const eligible = (items: { value: string }[]) => new Set(items.map((item) => item.value.toLowerCase()));
    const subjectInventory = eligible(inventory.subjects), cityInventory = eligible(inventory.cities), levelInventory = eligible(inventory.levels);
    const directories: MetadataRoute.Sitemap = [
      ...Object.entries(SUBJECTS).filter(([, value]) => subjectInventory.has(value.toLowerCase())).map(([slug]) => `/tutors/subject/${slug}`),
      ...Object.entries(CITIES).filter(([, value]) => cityInventory.has(value.toLowerCase())).map(([slug]) => `/tutors/city/${slug}`),
      ...Object.entries(LEVELS).filter(([, value]) => levelInventory.has(value.toLowerCase())).map(([slug]) => `/tutors/level/${slug}`),
    ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: "daily" as const, priority: 0.8 }));

    const countryHubResults = (
      await Promise.all(
        TARGET_COUNTRIES.map(async (code) => {
          if (!inventory.countries.some((item) => item.value.toUpperCase() === code.toUpperCase())) return [];
          return [
            // The country landing page itself ((countries)/[countryCode]) was
            // previously missing from the sitemap entirely - only its /tutors
            // sub-page was included, even though it's the main entry point
            // for that market and has its own content/metadata.
            { url: `${SITE_URL}/${code}`, lastModified, changeFrequency: "daily" as const, priority: 0.9 },
            { url: `${SITE_URL}/${code}/tutors`, lastModified, changeFrequency: "daily" as const, priority: 0.85 },
          ];
        })
      )
    ).flat();

    const homeTutorResults = await Promise.all(
      HOME_TUTOR_CITY_SLUGS.map(async (citySlug) => {
        const city = CITIES[citySlug];
        const { total } = await fetchTutors({ countryCode: "PK", city, teachingMode: "in-person" }, 1);
        return total >= 3
          ? {
              url: `${SITE_URL}/pk/home-tutors/${citySlug}`,
              lastModified,
              changeFrequency: "daily" as const,
              priority: 0.9,
            }
          : null;
      })
    );

    const research: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/research/pakistan-tutoring-rates`, lastModified, changeFrequency: "weekly", priority: 0.75 },
      { url: `${SITE_URL}/research/tutoring-index`, lastModified, changeFrequency: "weekly", priority: 0.75 },
    ];

    const [{ articles: blogPosts }, blogCategories] = await Promise.all([
      getEditorialArticles({ limit: 200 }),
      getEditorialCategories(),
    ]);
    const blog: MetadataRoute.Sitemap = [
      ...blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...blogCategories.map((cat) => ({
        url: `${SITE_URL}/blog/category/${categoryToSlug(cat.category)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    return [
      ...staticPages,
      ...directories,
      ...countryHubResults,
      ...homeTutorResults.filter((page): page is NonNullable<typeof page> => page !== null),
      ...research,
      ...blog,
    ];
  }

  if (id === 'tutors') {
    // See the TUTOR_SITEMAP_CAP comment above generateSitemaps() for why this is one
    // large shard rather than several - re-attempt splitting once tutor count approaches
    // this cap AND a Next.js version upgrade is confirmed to have fixed the matcher bug.
    const { tutors } = await fetchTutors({}, TUTOR_SITEMAP_CAP);
    const profiles: MetadataRoute.Sitemap = tutors.filter((tutor) => assessTutorSeoQuality(tutor).indexable).map((tutor) => ({
      url: `${SITE_URL}/tutors/${tutorProfileSlug(tutor)}`,
      lastModified: tutor.lastActiveAt ? new Date(tutor.lastActiveAt) : lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return profiles;
  }

  return [];
}
