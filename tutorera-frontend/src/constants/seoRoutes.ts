/**
 * Canonical configuration of private, authenticated, operational, and non-indexable routes.
 * Used uniformly across middleware.ts, robots.ts, and header directives.
 */

export const SEO_PRIVATE_PATHS = [
  "/admin",
  "/dashboard",
  "/billing",
  "/chat",
  "/earnings",
  "/notifications",
  "/offers",
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
] as const;

export const CANONICAL_HOST = "tutorera.ac.pk";

export const REDIRECT_HOSTS = new Set([
  "www.tutorera.ac.pk",
  "tutorera.mentisera.pk",
  "tutorera-frontend.vercel.app",
]);
