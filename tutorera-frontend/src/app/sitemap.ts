import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CITIES, LEVELS, SUBJECTS, fetchTutors } from "@/lib/tutor-directory";

const routes = [
  "", "about", "become-a-tutor", "blog", "contact", "coverage", "first-session-guarantee",
  "help", "help/for-parents", "help/for-tutors", "how-it-works", "levels", "pricing",
  "safety-policy", "subjects", "tutors", "terms", "privacy", "complaint-process", "cancellation-policy",
  "tutor-verification-standards", "review-policy", "editorial-policy", "academic-standards",
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
  return [...staticPages, ...directories, ...profiles];
}
