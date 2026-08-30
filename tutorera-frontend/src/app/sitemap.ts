import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const routes = [
  "", "about", "become-a-tutor", "blog", "contact", "coverage", "first-session-guarantee",
  "help", "help/for-parents", "help/for-tutors", "how-it-works", "levels", "pricing",
  "safety-policy", "subjects", "tutors", "terms", "privacy", "complaint-process", "cancellation-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${SITE_URL}/${route}`,
    lastModified,
    changeFrequency: route === "" || route === "tutors" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "tutors" ? 0.9 : 0.7,
  }));
}
