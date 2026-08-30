import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "tutorera.ac.pk";
const LEGACY_HOSTS = new Set(["tutorera.mentisera.pk", "tutorera-frontend.vercel.app"]);

export function proxy(request: NextRequest) {
  if (LEGACY_HOSTS.has(request.nextUrl.hostname.toLowerCase())) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    return NextResponse.redirect(destination, 301);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !request.cookies.get("token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
