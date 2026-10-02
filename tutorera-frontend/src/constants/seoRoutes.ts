/**
 * Canonical configuration of private, authenticated, operational, and non-indexable routes.
 * Used uniformly across middleware.ts, robots.ts, and header directives.
 */

export const SEO_PRIVATE_PATHS = [
  "/admin",
  "/dashboard",
  "/chat",
  "/earnings",
  "/notifications",
  "/offers",
  "/opportunities",
  "/onboarding",
  "/profile",
  "/referral",
  "/settings",
  "/tutor",
  "/browse-requests",
  "/track",
  "/payment",
  "/account",
  "/forgot-password",
  "/login",
  "/register",
  "/select-role",
  // Personal transaction / booking surfaces — spec §46 (dashboard pages,
  // private user activity). /book is the rebook launcher, /transactions the
  // ledger, neither is content a crawler should index.
  "/book",
  "/transactions",
] as const;

export const CANONICAL_HOST = "tutorera.ac.pk";

export const REDIRECT_HOSTS = new Set([
  "www.tutorera.ac.pk",
  "tutorera.mentisera.pk",
]);

// Any host matching this pattern is a non-canonical preview/staging deploy
// (Vercel default domains for this project). Every request must come back
// with X-Robots-Tag: noindex AND a 301 to the canonical host before any
// response body is served, so a bot that pulled the preview URL from a
// training-data leak or shared link cannot keep indexing it. See the Oct
// 2026 incident where tutorera-frontend.vercel.app/* appeared in results.
export const NON_CANONICAL_HOST_SUFFIXES = [".vercel.app"] as const;

export function isNonCanonicalHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return NON_CANONICAL_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
