import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma, bcrypt, or provider deps).
 *
 * Middleware imports ONLY this — pulling in the full lib/auth.ts (which
 * needs prisma + bcryptjs for the Credentials authorize() callback) would
 * blow past the Vercel edge function 1 MB compressed size limit and the
 * deploy lands in "ERROR" state right after the build succeeds.
 *
 * The real provider list, callbacks, and adapter live in lib/auth.ts and
 * are loaded only by the Node.js runtime (the /api/auth/* route handlers).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Trust the deployment host. Without this, edge middleware running on
  // Vercel preview deploys can reject session cookies because it sees a host
  // that doesn't match NEXTAUTH_URL/AUTH_URL. Vercel rewrites the Host header
  // through its own infrastructure, so this is safe here.
  trustHost: true,
  providers: [],
  callbacks: {
    // We still need a JWT callback so the cookie carries `userId`,
    // `subscriptionPlan`, and `onboardingCompleted` flags. The actual hydration
    // from DB happens in lib/auth.ts; here we just pass through whatever the
    // node-runtime callback set.
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const user = session.user as unknown as Record<string, unknown>;
        if (token.userId) user.id = token.userId;
        if (token.isAdmin !== undefined) user.isAdmin = token.isAdmin;
        if (token.subscriptionStatus !== undefined) user.subscriptionStatus = token.subscriptionStatus;
        if (token.subscriptionPlan !== undefined) user.subscriptionPlan = token.subscriptionPlan;
        if (token.onboardingCompleted !== undefined) user.onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
