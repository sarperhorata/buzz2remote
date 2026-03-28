import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = [
    "/dashboard",
    "/profile",
    "/applications",
    "/favorites",
    "/settings",
    "/resume-upload",
    "/notifications",
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", req.nextUrl.origin));
    }
    const isAdmin = req.auth?.user?.isAdmin;
    if (!isAdmin) {
      return Response.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return undefined;
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
  ],
};
