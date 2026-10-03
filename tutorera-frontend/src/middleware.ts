import { CANONICAL_HOST, REDIRECT_HOSTS, SEO_PRIVATE_PATHS } from "@/constants/seoRoutes";
import { NextRequest, NextResponse } from "next/server";

function isNonCanonicalHost(host: string) {
  return REDIRECT_HOSTS.has(host) || host.endsWith(".vercel.app");
}

function isParameterizedTutorListing(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, "");
  const isTutorListing = pathname === "/tutors" || pathname.endsWith("/tutors");
  return isTutorListing && request.nextUrl.searchParams.size > 0;
}

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  // Consolidate every public/preview deployment onto the production hostname.
  // This prevents Vercel preview aliases from competing with tutorera.ac.pk in search.
  if (isNonCanonicalHost(host)) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    return NextResponse.redirect(destination, 308);
  }

  const response = NextResponse.next();

  if (
    SEO_PRIVATE_PATHS.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`),
    )
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  // Filter/sort/query variants are useful for users but should not become
  // competing indexable landing pages. Keep links crawlable for discovery.
  if (isParameterizedTutorListing(request)) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }

  return response;
}

// OpenNext's Cloudflare build currently requires the legacy runtime identifier.
export const runtime = "experimental-edge";
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
