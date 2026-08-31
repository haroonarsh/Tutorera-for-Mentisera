import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CITIES, LEVELS, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS, fetchTutors } from "@/lib/tutor-directory";

const routes = [
  "", "about", "become-a-tutor", "blog", "contact", "coverage", "first-session-guarantee",
  "help", "help/for-parents", "help/for-tutors", "how-it-works", "how-tutor-offers-work", "levels", "locations", "pricing",
  "safety-policy", "subjects", "tutors", "terms", "privacy", "complaint-process", "cancellation-policy",
  "tutor-verification-standards", "review-policy", "editorial-policy", "academic-standards",
  "content-review-policy", "research-methodology", "tutor-screening-policy", "governance",
  "blog/how-to-find-a-trusted-tutor-in-pakistan", "blog/online-vs-home-tuition-in-pakistan",
  "blog/what-to-look-for-before-hiring-a-tutor-pakistan",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}/${route}`,
    lastModified,
    changeFrequency: route === "" || route === "tutors" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "tutors" ? 0.9 : 0.7,
  }));
  const directories: MetadataRoute.Sitemap = [
    ...Object.keys(SUBJECTS).map((slug) => `/tutors/subject/${slug}`),
    ...Object.keys(CITIES).map((slug) => `/tutors/city/${slug}`),
    ...Object.keys(LEVELS).map((slug) => `/tutors/level/${slug}`),
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: "daily", priority: 0.8 }));
  const { tutors } = await fetchTutors({}, 500);
  const profiles: MetadataRoute.Sitemap = tutors.map((tutor) => ({ url: `${SITE_URL}/tutors/${tutor._id}`, lastModified, changeFrequency: "weekly", priority: 0.7 }));
  const localResults = await Promise.all(PRIMARY_CITY_SLUGS.flatMap((citySlug) => LOCAL_SUBJECT_SLUGS.map(async (subjectSlug) => {
    const city = CITIES[citySlug]; const subject = SUBJECTS[subjectSlug];
    const { total } = await fetchTutors({ city, subject }, 1);
    return total > 0 ? { url: `${SITE_URL}/tutors/city/${citySlug}/${subjectSlug}`, lastModified, changeFrequency: "daily" as const, priority: 0.85 } : null;
  })));
  const research: MetadataRoute.Sitemap = tutors.length >= 10 ? [{ url: `${SITE_URL}/research/pakistan-tutoring-rates`, lastModified, changeFrequency: "weekly", priority: 0.75 }] : [];
  return [...staticPages, ...directories, ...localResults.filter((page): page is NonNullable<typeof page> => page !== null), ...research, ...profiles];
}
