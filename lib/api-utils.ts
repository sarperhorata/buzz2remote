import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";

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
 * Get authenticated user from session or return 401.
 * Use in API routes that require authentication.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }
  return { user: session.user, error: null };
}

/**
 * Get authenticated admin or return 403.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }
  if (!session.user.isAdmin) {
    return { user: null, error: errorResponse("Forbidden", 403) };
  }
  return { user: session.user, error: null };
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
