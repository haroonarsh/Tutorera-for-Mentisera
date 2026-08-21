import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

    if (isAdminRoute) {
        const token = request.cookies.get("token");
        if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
    }

    export const config = {
    matcher: ["/admin/:path*"],
};