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
