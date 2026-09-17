import { SEO_PRIVATE_PATHS } from "@/constants/seoRoutes";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

// Query strings that only ever reorder/filter an already-indexable listing -
// crawling every combination wastes crawl budget on near-duplicate content
// that all canonicalizes back to the same clean URL anyway (see
// alternates.canonical on /tutors and friends).
const NOISY_QUERY_PATTERNS = [
  "/*?*sort=",
  "/*?*minRate=",
  "/*?*rating=",
  "/*?*availability=",
  "/*?*currency=",
];

const PRIVATE_DISALLOW = [...SEO_PRIVATE_PATHS.map((p) => `${p}/`), "/api/", ...NOISY_QUERY_PATTERNS];

// Answer-engine / AI-search crawlers that can drive real traffic and citation
// back to TUTORERA when they browse or index it - allowed the same as any
// other crawler. Distinct from pure-scraping bots below, which have no
// referral upside for us (they don't send visitors or cite a source link the
// way an answer engine does) and are excluded from all TUTORERA content.
const AI_ANSWER_ENGINE_BOTS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", // OpenAI
  "ClaudeBot", "anthropic-ai", "Claude-Web", // Anthropic
  "PerplexityBot", "Perplexity-User", // Perplexity
  "Google-Extended", // Google's Gemini/AI Overviews training+grounding opt-in
  "Applebot-Extended", // Apple Intelligence
  "Bingbot", // Microsoft Copilot uses Bing's index
];

// Bots that scrape at scale purely to build training corpora, with no
// citation/referral mechanism back to the source - blocked site-wide.
// Revisit this list if a bot's policy changes or a new one shows up in logs.
const TRAINING_ONLY_SCRAPERS = ["CCBot", "Bytespider", "Amazonbot", "Diffbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_DISALLOW },
      ...AI_ANSWER_ENGINE_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE_DISALLOW })),
      ...TRAINING_ONLY_SCRAPERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
