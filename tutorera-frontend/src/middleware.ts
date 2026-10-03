import { CANONICAL_HOST, REDIRECT_HOSTS, SEO_PRIVATE_PATHS, isNonCanonicalHost } from "@/constants/seoRoutes";
import { NextRequest, NextResponse } from "next/server";

// Next 16 marks the `middleware` file convention as deprecated in favor
// of the `proxy` convention. The migration was attempted on 2026-10-03
// and reverted because:
//
//   1. Next 16 forbids `export const runtime = "experimental-edge"` and
//      `export const config = { matcher: ... }` in proxy.ts — proxy is
//      Node-runtime only. The build fails with "Route segment config is
//      not allowed in Proxy file".
//
//   2. OpenNext's Cloudflare adapter still bundles via the middleware
//      convention + the `experimental-edge` runtime identifier (see the
//      comment on the runtime export below). Switching the source file
//      alone without a matched OpenNext upgrade risks breaking the
//      production Cloudflare Worker.
//
// Until OpenNext ships proxy-compatible Cloudflare bundling, this file
// stays on the middleware convention. The deprecation emits a build
// warning but not a build failure, so this is a cosmetic blocker only.
// Track OpenNext release notes for a safe migration window.
export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  // Vercel preview / staging host — pin to noindex AND redirect to the
  // canonical host so a bot that already pulled a *.vercel.app URL stops
  // caching it. Headers are set on the redirect itself so even the 301
  // carries the noindex directive.
  if (isNonCanonicalHost(host)) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    const redirect = NextResponse.redirect(destination, 301);
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirect;
  }

  if (REDIRECT_HOSTS.has(host)) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    return NextResponse.redirect(destination, 301);
  }

  const response = NextResponse.next();
  if (SEO_PRIVATE_PATHS.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

// OpenNext's Cloudflare build currently requires the legacy runtime identifier.
export const runtime = "experimental-edge";
export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
