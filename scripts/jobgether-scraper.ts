// Jobgether scraper.
//
// Jobgether hides ATS apply URLs behind their own "Apply" button. When a user
// clicks it, the destination URL leaks into outbound analytics requests
// (Google Analytics / GTM payload) and/or a freshly opened tab. We exploit
// both signals to recover the real ATS URL (Paylocity, Greenhouse, Lever,
// Ashby, Workable, Workday, etc.).
//
// SECURITY AUDIT (our own apply flow on buzz2remote-next):
//   - Apply URL is NEVER sent to the client. /app/api/jobs/[id]/apply/route.ts
//     does a server-side `NextResponse.redirect(applyUrl)` after auth. The
//     browser sees only the redirect response Location header, not the JS.
//   - The apply button in /app/(app)/jobs/[id]/page.tsx points at the relative
//     path `/api/jobs/[id]/apply` (or `/login?callbackUrl=...` if logged out).
//     The actual ATS URL never reaches the rendered HTML.
//   - /app/layout.tsx loads no analytics scripts (no gtag, GTM, Plausible,
//     Segment, Mixpanel, Amplitude). A repo-wide grep for those identifiers
//     returns zero hits in app/, components/, lib/.
//   - Conclusion: our apply flow does NOT leak destination URLs the way
//     Jobgether's does. Only the server learns the apply URL; the click
//     produces a 3xx redirect with no client-side analytics in the loop.
//
// Caveat: the actual Jobgether HTML structure below is best-effort based on
// common Next.js patterns and the task description. Selectors are tolerant
// and fall back to __NEXT_DATA__ extraction where possible. If Jobgether
// changes markup, the structured-field extraction may need tuning — but the
// apply-URL recovery (network sniffing + new-tab capture) is structure-
// independent and should keep working.

import { prisma } from "@/lib/db";
import crypto from "crypto";

// ---------- Public types ----------

export interface JobgetherJobData {
  externalId: string;
  sourceUrl: string;
  applyUrl: string | null;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  remoteType: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  skills: string[];
  postedAt: Date | null;
}

export interface ScrapeAndSaveResult {
  scraped: number;
  saved: number;
  failed: number;
  errors: string[];
}

// ---------- Constants ----------

const JOBGETHER_BASE = "https://jobgether.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ANALYTICS_HOST_PATTERNS = [
  "google-analytics.com",
  "googletagmanager.com",
  "analytics.google.com",
  "doubleclick.net",
  "mixpanel.com",
  "segment.com",
  "segment.io",
  "amplitude.com",
  "hotjar.com",
  "facebook.com/tr",
];

// Known ATS / applicant tracking system hosts. If a URL points to any of
// these we treat it as the real apply URL.
const ATS_HOST_PATTERNS = [
  "paylocity.com",
  "greenhouse.io",
  "boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "ashbyhq.com",
  "jobs.ashbyhq.com",
  "workable.com",
  "apply.workable.com",
  "smartrecruiters.com",
  "jobs.smartrecruiters.com",
  "breezy.hr",
  "recruitee.com",
  "jobvite.com",
  "bamboohr.com",
  "taleo.net",
  "icims.com",
  "workday.com",
  "myworkdayjobs.com",
  "successfactors.com",
  "oracle.com/jobs",
  "brassring.com",
  "rippling.com",
  "personio.de",
  "personio.com",
  "teamtailor.com",
  "hire.lever.co",
  "applytojob.com",
  "jazzhr.com",
  "pinpointhq.com",
  "jobs.gohire.io",
  "join.com",
  "comeet.com",
  "polymer.co",
];

// ---------- Tiny utilities ----------

const randomDelay = (min: number, max: number) =>
  new Promise<void>((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );

function log(msg: string) {
  console.log(`[jobgether] ${new Date().toISOString()} ${msg}`);
}

/** Extract the 24-char hex external id from a Jobgether offer URL. */
export function extractExternalId(url: string): string | null {
  const m = /\/offer\/([a-f0-9]{24})/i.exec(url);
  return m?.[1] ?? null;
}

/**
 * Parse compensation strings like:
 *   "USD 60k - 135k"
 *   "$80,000 – $120,000"
 *   "€50k"
 *   "60000 - 90000 EUR"
 * Returns { min, max, currency } in whole units. min/max may be equal when
 * a single number is given. Returns null if nothing parseable.
 */
export function parseSalary(
  text: string | null | undefined,
): { min: number | null; max: number | null; currency: string | null } | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned || /not\s*disclosed|undisclosed|not\s*specified/i.test(cleaned))
    return null;

  let currency: string | null = null;
  if (/\bUSD\b|\$/i.test(cleaned)) currency = "USD";
  else if (/\bEUR\b|€/i.test(cleaned)) currency = "EUR";
  else if (/\bGBP\b|£/i.test(cleaned)) currency = "GBP";
  else if (/\bCAD\b/i.test(cleaned)) currency = "CAD";
  else if (/\bAUD\b/i.test(cleaned)) currency = "AUD";

  // Find numeric tokens with optional k suffix.
  const tokenRe = /([0-9]+(?:[.,][0-9]+)*)\s*(k|K)?/g;
  const nums: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(cleaned))) {
    const raw = match[1].replace(/,/g, "");
    let n = parseFloat(raw);
    if (!Number.isFinite(n)) continue;
    if (match[2]) n *= 1000;
    // Heuristic: if no `k` and the value is small ( <1000 ) it's probably
    // not a salary (could be "5 years"). Skip.
    if (!match[2] && n < 1000) continue;
    nums.push(Math.round(n));
  }
  if (nums.length === 0) return null;
  const min = nums[0];
  const max = nums.length > 1 ? nums[nums.length - 1] : nums[0];
  return { min, max: max >= min ? max : min, currency };
}

/** Pull every http(s) URL out of an arbitrary string. */
function extractUrls(s: string): string[] {
  const out: string[] = [];
  const re = /https?:\/\/[^\s"'<>&]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[0]);
  // Also try url-decoded matches — GA encodes the `dl` param.
  try {
    const decoded = decodeURIComponent(s);
    if (decoded !== s) {
      while ((m = re.exec(decoded))) out.push(m[0]);
    }
  } catch {
    // ignore
  }
  return out;
}

function isAtsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("jobgether.com")) return false;
  for (const host of ANALYTICS_HOST_PATTERNS) {
    if (lower.includes(host)) return false;
  }
  return ATS_HOST_PATTERNS.some((h) => lower.includes(h));
}

/** From a pile of intercepted URLs/bodies, pick the most likely apply URL. */
function findApplyUrlInTraffic(blobs: string[]): string | null {
  const candidates = new Set<string>();
  for (const blob of blobs) {
    for (const u of extractUrls(blob)) {
      if (isAtsUrl(u)) candidates.add(u);
    }
  }
  if (candidates.size === 0) return null;
  // Prefer the longest URL (most specific path).
  return [...candidates].sort((a, b) => b.length - a.length)[0];
}

// ---------- Lazy Playwright loader (keeps it out of client bundles) ----------

async function launchBrowser() {
  const { chromium } = await import("playwright");
  return chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
}

async function newHardenedContext(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
) {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  return context;
}

// ---------- Page extraction ----------

interface NextDataJob {
  title?: string;
  company?: { name?: string } | string;
  companyName?: string;
  location?: string;
  description?: string;
  remoteType?: string;
  jobType?: string;
  contractType?: string;
  experienceLevel?: string;
  seniority?: string;
  salary?: string;
  compensation?: string;
  skills?: string[] | { name: string }[];
  tags?: string[];
  postedAt?: string;
  publishedAt?: string;
  createdAt?: string;
}

/**
 * Walk an arbitrary JSON tree, returning the first object that looks like a
 * job (has both `title` and either `company` or `companyName`). Used to
 * fish data out of __NEXT_DATA__ when the page is a React/Next.js app.
 */
function findJobNode(node: unknown): NextDataJob | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobNode(item);
      if (found) return found;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  if (
    typeof obj.title === "string" &&
    (typeof obj.company === "string" ||
      typeof obj.companyName === "string" ||
      (typeof obj.company === "object" && obj.company !== null))
  ) {
    return obj as NextDataJob;
  }
  for (const k of Object.keys(obj)) {
    const found = findJobNode(obj[k]);
    if (found) return found;
  }
  return null;
}

function companyOf(n: NextDataJob): string {
  if (typeof n.company === "string") return n.company;
  if (n.company && typeof n.company === "object" && n.company.name)
    return n.company.name;
  if (n.companyName) return n.companyName;
  return "";
}

function skillsOf(n: NextDataJob): string[] {
  const raw = n.skills ?? n.tags ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (typeof s === "string" ? s : s && s.name ? s.name : ""))
    .filter((s): s is string => !!s);
}

function parsePostedDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ---------- Single-job scrape ----------

export async function scrapeJobgetherJob(
  url: string,
): Promise<JobgetherJobData | null> {
  const externalId = extractExternalId(url);
  if (!externalId) {
    log(`Invalid jobgether URL (no external id): ${url}`);
    return null;
  }

  const browser = await launchBrowser();
  try {
    const context = await newHardenedContext(browser);
    const page = await context.newPage();

    // Network sniffer for analytics-leaked apply URL.
    const networkBlobs: string[] = [];
    page.on("request", (req) => {
      const reqUrl = req.url();
      const isAnalytics = ANALYTICS_HOST_PATTERNS.some((h) =>
        reqUrl.includes(h),
      );
      if (isAnalytics) {
        networkBlobs.push(reqUrl);
        const body = req.postData();
        if (body) networkBlobs.push(body);
      }
      // Also keep any direct ATS hit (some apply buttons hit the ATS
      // directly via XHR before the redirect).
      if (isAtsUrl(reqUrl)) networkBlobs.push(reqUrl);
    });

    // Capture any new tab opened by the Apply click — its URL is THE apply URL.
    const popupState: { url: string | null } = { url: null };
    context.on("page", async (popup) => {
      try {
        await popup.waitForLoadState("domcontentloaded", { timeout: 8000 });
        const u = popup.url();
        if (u && !u.includes("jobgether.com")) popupState.url = u;
        await popup.close().catch(() => {});
      } catch {
        // ignore
      }
    });

    log(`Navigating: ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await randomDelay(1500, 2500);

    // 1) Try __NEXT_DATA__ first.
    let nextJob: NextDataJob | null = null;
    try {
      const nextDataStr = await page.evaluate(() => {
        const el = document.getElementById("__NEXT_DATA__");
        return el?.textContent ?? null;
      });
      if (nextDataStr) {
        const parsed = JSON.parse(nextDataStr);
        nextJob = findJobNode(parsed);
      }
    } catch (err) {
      log(`__NEXT_DATA__ parse failed: ${(err as Error).message}`);
    }

    // 2) Fall back to DOM scraping.
    const domTitle =
      (await page
        .locator("h1")
        .first()
        .innerText()
        .catch(() => "")) || "";

    const bodyText = await page
      .evaluate(() => document.body.innerText || "")
      .catch(() => "");

    const title = nextJob?.title?.trim() || domTitle.trim() || "";

    let company = nextJob ? companyOf(nextJob) : "";
    if (!company) {
      // Heuristic: company often appears immediately after title in the layout.
      const m = bodyText.match(
        new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n([^\\n]+)`),
      );
      if (m) company = m[1].trim();
    }

    const location =
      nextJob?.location ??
      (bodyText.match(/Location[:\s]+([^\n]+)/i)?.[1]?.trim() || null);

    const remoteType =
      nextJob?.remoteType ??
      (bodyText.match(/(Full Remote|Hybrid|On-?site|Remote)/i)?.[1] || null);

    const jobType =
      nextJob?.jobType ??
      nextJob?.contractType ??
      (bodyText.match(
        /(Full-?time|Part-?time|Contract|Internship|Freelance|Temporary)/i,
      )?.[1] || null);

    const experienceLevel =
      nextJob?.experienceLevel ??
      nextJob?.seniority ??
      (bodyText.match(
        /(Entry[-\s]?level|Junior|Mid[-\s]?level|Senior(?:\s*\([^)]+\))?|Lead|Principal|Staff|Executive)/i,
      )?.[1] || null);

    const salaryRaw =
      nextJob?.salary ??
      nextJob?.compensation ??
      (bodyText.match(
        /((?:USD|EUR|GBP|CAD|AUD|\$|€|£)\s*[0-9][^\n]{0,40}?(?:k|000)(?:\s*[-–]\s*[0-9][^\n]{0,40}?(?:k|000))?)/i,
      )?.[1]?.trim() || null);

    const parsedSalary = parseSalary(salaryRaw);

    const skills = nextJob ? skillsOf(nextJob) : [];

    const descFromDom = await page
      .locator(
        'article, [class*="description" i], [data-testid*="description" i]',
      )
      .first()
      .innerText()
      .catch(() => "");
    const description = (nextJob?.description ?? descFromDom) || null;

    const postedAt = parsePostedDate(
      nextJob?.postedAt ?? nextJob?.publishedAt ?? nextJob?.createdAt,
    );

    // 3) Trigger Apply to leak the destination URL.
    log("Locating apply button to trigger leak...");
    const applyCandidates = [
      'button:has-text("Apply")',
      'a:has-text("Apply")',
      '[data-testid*="apply" i]',
      '[class*="apply" i] button',
    ];
    let clicked = false;
    for (const sel of applyCandidates) {
      const btn = page.locator(sel).first();
      if ((await btn.count().catch(() => 0)) > 0) {
        try {
          await btn.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
          await btn.click({ timeout: 5000, force: true });
          clicked = true;
          log(`Clicked apply via selector: ${sel}`);
          break;
        } catch {
          // try next selector
        }
      }
    }
    if (!clicked) log("No apply button found — apply URL may be null.");

    // Give analytics and any popup a moment.
    await randomDelay(2500, 4000);

    // 4) Choose the best apply URL.
    let applyUrl: string | null = null;
    if (popupState.url && !popupState.url.includes("jobgether.com")) {
      applyUrl = popupState.url;
      log(`Apply URL from new tab: ${applyUrl}`);
    } else {
      applyUrl = findApplyUrlInTraffic(networkBlobs);
      if (applyUrl) log(`Apply URL from analytics traffic: ${applyUrl}`);
    }
    if (!applyUrl) {
      log(`WARNING: no apply URL recovered for ${url}`);
    }

    await context.close();

    return {
      externalId,
      sourceUrl: url,
      applyUrl,
      title,
      company,
      location: location || null,
      description: description || null,
      remoteType: remoteType || null,
      jobType: jobType || null,
      experienceLevel: experienceLevel || null,
      salaryRaw: salaryRaw || null,
      salaryMin: parsedSalary?.min ?? null,
      salaryMax: parsedSalary?.max ?? null,
      salaryCurrency: parsedSalary?.currency ?? null,
      skills,
      postedAt,
    };
  } catch (err) {
    log(`scrapeJobgetherJob failed: ${(err as Error).message}`);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

// ---------- Listing ----------

export async function listJobgetherJobs(
  opts: { maxPages?: number; query?: string } = {},
): Promise<string[]> {
  const maxPages = opts.maxPages ?? 3;
  const browser = await launchBrowser();
  try {
    const context = await newHardenedContext(browser);
    const page = await context.newPage();

    const listingUrl = opts.query
      ? `${JOBGETHER_BASE}/jobs?q=${encodeURIComponent(opts.query)}`
      : `${JOBGETHER_BASE}/jobs`;

    log(`Listing: ${listingUrl}`);
    await page.goto(listingUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await randomDelay(1500, 2500);

    const seen = new Set<string>();

    const collect = async () => {
      const hrefs = await page.$$eval('a[href^="/offer/"]', (els) =>
        (els as HTMLAnchorElement[]).map((a) => a.getAttribute("href") || ""),
      );
      for (const h of hrefs) {
        if (h) seen.add(`${JOBGETHER_BASE}${h.split("?")[0]}`);
      }
    };

    await collect();

    for (let i = 0; i < maxPages; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await randomDelay(1800, 3000);
      const before = seen.size;
      await collect();
      log(`Scroll ${i + 1}/${maxPages}: ${seen.size} URLs (+${seen.size - before})`);
      if (seen.size === before) break;
    }

    await context.close();
    return [...seen];
  } finally {
    await browser.close().catch(() => {});
  }
}

// ---------- Save / upsert ----------

function mapToJobsRow(data: JobgetherJobData) {
  const salaryRange =
    data.salaryMin && data.salaryMax
      ? `${data.salaryCurrency || ""} ${data.salaryMin} - ${data.salaryMax}`.trim()
      : data.salaryRaw;
  return {
    title: data.title.slice(0, 500) || "Untitled",
    company: (data.company || "Unknown").slice(0, 255),
    location: data.location?.slice(0, 500) || null,
    description: data.description,
    salary: data.salaryRaw?.slice(0, 255) || null,
    salary_min: data.salaryMin,
    salary_max: data.salaryMax,
    salary_currency: data.salaryCurrency?.slice(0, 10) || null,
    salary_range: salaryRange?.slice(0, 255) || null,
    job_type: data.jobType?.slice(0, 50) || null,
    experience_level: data.experienceLevel?.slice(0, 50) || null,
    remote_type: data.remoteType?.slice(0, 50) || null,
    is_remote: data.remoteType
      ? /remote/i.test(data.remoteType) && !/on-?site/i.test(data.remoteType)
      : null,
    skills: data.skills as unknown as object,
    apply_url: data.applyUrl?.slice(0, 1024) || null,
    source: "jobgether",
    source_url: data.sourceUrl.slice(0, 1024),
    source_type: "scraper",
    external_id: data.externalId.slice(0, 255),
    posted_date: data.postedAt,
    last_updated: new Date(),
  };
}

export async function scrapeAndSaveJobgether(
  opts: { maxPages?: number; query?: string; limit?: number } = {},
): Promise<ScrapeAndSaveResult> {
  const limit = opts.limit ?? 20;
  const result: ScrapeAndSaveResult = {
    scraped: 0,
    saved: 0,
    failed: 0,
    errors: [],
  };

  let urls: string[] = [];
  try {
    urls = await listJobgetherJobs({
      maxPages: opts.maxPages,
      query: opts.query,
    });
  } catch (err) {
    result.errors.push(`listing failed: ${(err as Error).message}`);
    return result;
  }

  log(`Discovered ${urls.length} URLs, scraping up to ${limit}`);
  const targets = urls.slice(0, limit);

  for (let i = 0; i < targets.length; i++) {
    const url = targets[i];
    const externalId = extractExternalId(url);
    if (!externalId) {
      result.failed++;
      result.errors.push(`bad url: ${url}`);
      continue;
    }

    try {
      // Skip if we have a fresh row (<24h).
      const existing = await prisma.jobs.findUnique({
        where: {
          source_external_id: { source: "jobgether", external_id: externalId },
        },
        select: { updated_at: true },
      });
      if (existing) {
        const ageMs = Date.now() - new Date(existing.updated_at).getTime();
        if (ageMs < 24 * 60 * 60 * 1000) {
          log(`Skipping fresh row ${externalId}`);
          continue;
        }
      }

      const data = await scrapeJobgetherJob(url);
      result.scraped++;
      if (!data) {
        result.failed++;
        result.errors.push(`scrape returned null for ${url}`);
        continue;
      }

      const row = mapToJobsRow(data);
      await prisma.jobs.upsert({
        where: {
          source_external_id: { source: "jobgether", external_id: externalId },
        },
        update: { ...row, updated_at: new Date() },
        create: {
          id: crypto.randomUUID(),
          ...row,
          is_active: true,
          archived: false,
          is_translated: false,
          views_count: 0,
          applications_count: 0,
        },
      });
      result.saved++;
      log(`Saved ${externalId} (${data.title} @ ${data.company})`);
    } catch (err) {
      result.failed++;
      result.errors.push(`${url}: ${(err as Error).message}`);
      log(`ERROR ${url}: ${(err as Error).message}`);
    }

    // Polite delay between jobs.
    if (i < targets.length - 1) await randomDelay(3000, 7000);
  }

  return result;
}
