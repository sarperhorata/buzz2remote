import { NextRequest, NextResponse } from "next/server";
import { importJobs } from "@/lib/job-importer";

// Vercel Cron or manual trigger with auth
export async function GET(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    request.headers.get("x-admin-key") === process.env.NEXTAUTH_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[fetch-jobs] Starting job import...");
    const result = await importJobs();
    console.log(`[fetch-jobs] Done: ${result.imported} new, ${result.skippedDuplicates} updated, ${result.errors} errors`);

    return NextResponse.json({
      message: "Job import completed",
      ...result,
    });
  } catch (error) {
    console.error("[fetch-jobs] Failed:", error);
    return NextResponse.json(
      { error: "Job import failed", detail: String(error) },
      { status: 500 }
    );
  }
}

// Allow POST as well (for manual triggers from admin panel)
export async function POST(request: NextRequest) {
  return GET(request);
}
