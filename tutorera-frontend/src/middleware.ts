import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "tutorera.ac.pk";
const LEGACY_HOSTS = new Set(["tutorera.mentisera.pk", "tutorera-frontend.vercel.app"]);
const PRIVATE_PATHS = ["/admin", "/billing", "/chat", "/dashboard", "/earnings", "/forgot-password", "/login", "/notifications", "/offers", "/onboarding", "/profile", "/referral", "/register", "/select-role", "/settings", "/tutor"];

export function middleware(request: NextRequest) {
  if (LEGACY_HOSTS.has(request.nextUrl.hostname.toLowerCase())) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    return NextResponse.redirect(destination, 301);
  }

  const response = NextResponse.next();
  if (PRIVATE_PATHS.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

// OpenNext's Cloudflare build currently requires the legacy runtime identifier.
export const runtime = "experimental-edge";
export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
