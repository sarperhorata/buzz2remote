import { NextRequest, NextResponse } from "next/server";
import { scrapeAndSaveJobgether } from "@/lib/scrapers/jobgether";

// IMPORTANT: this route launches a headless Playwright browser. It is
// intentionally heavy and only suitable for environments where chromium is
// installed and disk + memory are available.
//
// On Vercel serverless this will likely cold-start poorly with the stock
// `playwright` import — you'd want to swap to `@sparticuz/chromium` +
// `playwright-core` for production deployment. For now this endpoint is
// intended to be triggered from a local cron, a long-running worker, or a
// manual admin call from a machine that already has Playwright browsers.
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    request.headers.get("x-admin-key") === process.env.NEXTAUTH_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[scrape-jobgether] starting...");
    const result = await scrapeAndSaveJobgether({ maxPages: 3, limit: 30 });
    console.log(
      `[scrape-jobgether] done: scraped=${result.scraped} saved=${result.saved} failed=${result.failed}`,
    );
    return NextResponse.json({ message: "Scrape complete", ...result });
  } catch (err) {
    console.error("[scrape-jobgether] failed", err);
    return NextResponse.json(
      { error: "Scrape failed", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
