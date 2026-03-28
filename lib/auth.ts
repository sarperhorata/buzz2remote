import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashed_password || !user.is_active) return null;

        const isValid = await compare(
          credentials.password as string,
          user.hashed_password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          image: user.profile_picture_url,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "linkedin") {
        if (!user.email) return false;

        const existingUser = await prisma.users.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Link OAuth account to existing user
          const updateData: Record<string, string | null> = {
            auth_provider: account.provider,
          };
          if (account.provider === "google") {
            updateData.google_id = account.providerAccountId;
          } else {
            updateData.linkedin_id = account.providerAccountId;
            updateData.linkedin_access_token = account.access_token ?? null;
          }
          if (user.image && !existingUser.profile_picture_url) {
            updateData.profile_picture_url = user.image;
          }
          await prisma.users.update({
            where: { id: existingUser.id },
            data: updateData,
          });
        } else {
          // Create new user from OAuth
          await prisma.users.create({
            data: {
              id: crypto.randomUUID(),
              email: user.email,
              full_name: user.name ?? "",
              auth_provider: account.provider,
              google_id:
                account.provider === "google"
                  ? account.providerAccountId
                  : null,
              linkedin_id:
                account.provider === "linkedin"
                  ? account.providerAccountId
                  : null,
              linkedin_access_token:
                account.provider === "linkedin"
                  ? (account.access_token ?? null)
                  : null,
              profile_picture_url: user.image ?? null,
              is_active: true,
              is_superuser: false,
              email_verified: true,
              onboarding_completed: false,
              onboarding_step: 0,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Initial sign in — attach DB user info
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            is_superuser: true,
            subscription_status: true,
            subscription_plan: true,
            onboarding_completed: true,
          },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.isAdmin = dbUser.is_superuser;
          token.subscriptionStatus = dbUser.subscription_status;
          token.subscriptionPlan = dbUser.subscription_plan;
          token.onboardingCompleted = dbUser.onboarding_completed;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>;
        user.id = token.userId as string;
        user.isAdmin = token.isAdmin as boolean;
        user.subscriptionStatus = token.subscriptionStatus as string | null;
        user.subscriptionPlan = token.subscriptionPlan as string | null;
        user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
});
