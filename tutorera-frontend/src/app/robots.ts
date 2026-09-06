import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SEO_PRIVATE_PATHS } from "@/constants/seoRoutes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: SEO_PRIVATE_PATHS.map((p) => `${p}/`),
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
