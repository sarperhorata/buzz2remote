import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/applications",
  "/favorites",
  "/settings",
  "/resume-upload",
  "/notifications",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check JWT token (lightweight, no Prisma import)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  // Protected routes
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!token?.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/applications/:path*",
    "/favorites/:path*",
    "/settings/:path*",
    "/resume-upload/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
