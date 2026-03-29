import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";
import * as crypto from "crypto";

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return errorResponse(error.issues[0].message, 400);
  }

  return errorResponse("Internal server error", 500);
}

/**
 * Verify a mobile JWT token (simple HMAC-based).
 */
async function verifyMobileToken(token: string) {
  try {
    const [payloadB64, signatureB64] = token.split(".");
    if (!payloadB64 || !signatureB64) return null;

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
    if (expectedSig !== signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    return payload as { userId: string; email: string; name: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

/**
 * Create a mobile JWT token (simple HMAC-based).
 */
export function createMobileToken(payload: { userId: string; email: string; name: string; isAdmin: boolean }) {
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
  const data = { ...payload, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }; // 30 days
  const payloadB64 = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Get authenticated user from session (web) or Bearer token (mobile).
 */
export async function requireAuth() {
  // Try NextAuth session first (web)
  const session = await auth();
  if (session?.user?.id) {
    return { user: session.user, error: null };
  }

  // Try Bearer token (mobile)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (payload) {
      return {
        user: { id: payload.userId, email: payload.email, name: payload.name, isAdmin: payload.isAdmin } as NonNullable<typeof session>["user"],
        error: null,
      };
    }
  }

  return { user: null, error: errorResponse("Unauthorized", 401) };
}

/**
 * Get authenticated admin or return 403.
 */
export async function requireAdmin() {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };
  if (!user?.isAdmin) {
    return { user: null, error: errorResponse("Forbidden", 403) };
  }
  return { user, error: null };
}

/**
 * Parse search params from URL into a plain object.
 */
export function parseSearchParams(url: string): Record<string, string> {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
