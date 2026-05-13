// NOTE: this file uses Auth.js v5's `auth()` wrapper instead of the legacy
// `getToken` from "next-auth/jwt". Auth.js v5 renamed the session cookie
// from `__Secure-next-auth.session-token` to `__Secure-authjs.session-token`;
// `getToken` from the legacy import looks for the old name, so it returned
// `null` for genuinely-logged-in users and bounced them back to /login.
//
// Next.js 16 deprecates this file in favor of `proxy.ts`, but the convention
// still works for now and Vercel logs only a warning. Will migrate later.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/applications",
  "/favorites",
  "/settings",
  "/resume-upload",
  "/notifications",
  "/coaching",
  "/career-diagnosis",
  "/cv-review",
  "/linkedin-optimizer",
  "/top-matches",
];

// Paths that are exempt from the onboarding redirect
const onboardingExemptPrefixes = [
  "/onboarding",
  "/api",
  "/payment",
  "/_next",
  "/favicon.ico",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;
  const isLoggedIn = !!session?.user;

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
    const user = session?.user as { isAdmin?: boolean } | undefined;
    if (!user?.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Onboarding redirect: logged-in users who haven't completed onboarding
  const user = session?.user as { onboardingCompleted?: boolean } | undefined;
  if (
    isLoggedIn &&
    user?.onboardingCompleted === false &&
    !onboardingExemptPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
});

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
    "/jobs/:path*",
    "/companies/:path*",
    "/coaching/:path*",
    "/career-diagnosis/:path*",
    "/cv-review/:path*",
    "/linkedin-optimizer/:path*",
    "/top-matches/:path*",
    "/onboarding/:path*",
  ],
};
