import { chromium, Browser, Page } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WELLFOUND_EMAIL = process.env.WELLFOUND_EMAIL!;
const WELLFOUND_PASSWORD = process.env.WELLFOUND_PASSWORD!;

export interface BotStats {
  applied: number;
  skipped: number;
  longForm: Array<{ title: string; company: string; url: string }>;
  errors: string[];
  blocked: boolean;
  totalSeen: number;
}

async function getSarperUserId(): Promise<string | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { email: WELLFOUND_EMAIL },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function hasAlreadyApplied(userId: string, externalId: string): Promise<boolean> {
  try {
    const existing = await prisma.user_applications.findFirst({
      where: {
        user_id: userId,
        jobs: {
          source: "wellfound",
          external_id: externalId,
        },
      },
    });
    return !!existing;
  } catch {
    return false;
  }
}

async function recordApplication(
  userId: string,
  jobData: {
    title: string;
    company: string;
    url: string;
    externalId: string;
    status: string;
    applicationType: string;
  }
) {
  try {
  // Upsert job
  const job = await prisma.jobs.upsert({
    where: {
      source_external_id: {
        source: "wellfound",
        external_id: jobData.externalId,
      },
    },
    update: {
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      title: jobData.title,
      company: jobData.company,
      apply_url: jobData.url,
      source: "wellfound",
      source_url: jobData.url,
      external_id: jobData.externalId,
      is_active: true,
      is_remote: true,
      archived: false,
      is_translated: false,
      views_count: 0,
      applications_count: 0,
    },
  });

  // Record application
  await prisma.user_applications.upsert({
    where: {
      user_id_job_id: {
        user_id: userId,
        job_id: job.id,
      },
    },
    update: {
      status: jobData.status,
      application_type: jobData.applicationType,
      updated_at: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      user_id: userId,
      job_id: job.id,
      status: jobData.status,
      application_type: jobData.applicationType,
      viewed_by_company: false,
      applied_at: new Date(),
    },
  });
  } catch {
    // DB unavailable - continue without recording
  }
}

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto("https://wellfound.com/login", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', WELLFOUND_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', WELLFOUND_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 15000 });
    const url = page.url();
    return !url.includes("/login");
  } catch (e) {
    return false;
  }
}

async function isBlocked(page: Page): Promise<boolean> {
  const content = await page.content();
  return (
    content.includes("Access is temporarily restricted") ||
    content.includes("unusual activity") ||
    content.includes("Access denied") ||
    content.includes("captcha") ||
    content.includes("Cloudflare") ||
    page.url().includes("challenge")
  );
}

async function scrapeAndApplyJobs(page: Page, userId: string, stats: BotStats): Promise<void> {
  const searchUrls = [
    "https://wellfound.com/jobs?remote=true&role=Software+Engineer",
    "https://wellfound.com/jobs?remote=true&role=Full+Stack+Engineer",
    "https://wellfound.com/jobs?remote=true&role=Backend+Engineer",
    "https://wellfound.com/jobs?remote=true&role=Frontend+Engineer",
  ];

  for (const searchUrl of searchUrls) {
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);

      if (await isBlocked(page)) {
        stats.blocked = true;
        stats.errors.push("Bot detection triggered on: " + searchUrl);
        return;
      }

      // Scroll to load more jobs
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1500);
      }

      // Find job cards
      const jobCards = await page.$$('[data-test="JobListing"], .styles_component__Ey28k, [class*="JobListingCard"], [class*="job-listing"]');

      if (jobCards.length === 0) {
        // Try alternative selector
        const allLinks = await page.$$('a[href*="/jobs/"]');
        for (const link of allLinks.slice(0, 20)) {
          const href = await link.getAttribute("href");
          if (href && href.match(/\/jobs\/[\w-]+-\d+/)) {
            await processJobPage(page, userId, stats, `https://wellfound.com${href}`);
          }
        }
      } else {
        for (const card of jobCards.slice(0, 15)) {
          try {
            const link = await card.$('a[href*="/jobs/"]');
            if (!link) continue;
            const href = await link.getAttribute("href");
            if (!href) continue;
            const jobUrl = href.startsWith("http") ? href : `https://wellfound.com${href}`;
            await processJobPage(page, userId, stats, jobUrl);
          } catch (e) {
            stats.errors.push(`Card error: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      stats.errors.push(`Search error on ${searchUrl}: ${(e as Error).message}`);
    }
  }
}

async function processJobPage(page: Page, userId: string, stats: BotStats, jobUrl: string): Promise<void> {
  try {
    stats.totalSeen++;
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    if (await isBlocked(page)) {
      stats.blocked = true;
      return;
    }

    // Extract job ID from URL
    const urlMatch = jobUrl.match(/\/jobs\/([\w-]+-(\d+))/) || jobUrl.match(/\/jobs\/([\w-]+)/);
    const externalId = urlMatch ? urlMatch[1] : jobUrl.replace(/[^a-z0-9]/gi, "-");

    // Check if already applied
    if (await hasAlreadyApplied(userId, externalId)) {
      stats.skipped++;
      return;
    }

    // Extract job title and company
    const titleEl = await page.$('h1, [data-test="job-title"], [class*="job-title"], [class*="jobTitle"]');
    const title = titleEl ? (await titleEl.textContent()) ?? "Unknown Title" : "Unknown Title";

    const companyEl = await page.$('[data-test="company-name"], [class*="company-name"], [class*="companyName"] a, h2 a');
    const company = companyEl ? (await companyEl.textContent()) ?? "Unknown Company" : "Unknown Company";

    // Look for easy apply button (1-click)
    const easyApplyBtn = await page.$(
      '[data-test="EasyApply"], [class*="easy-apply"], button:has-text("Easy Apply"), button:has-text("1-Click Apply"), [data-test="apply-button"]'
    );

    if (easyApplyBtn) {
      // Check if it's truly 1-click or has a form
      const btnText = (await easyApplyBtn.textContent()) ?? "";

      if (btnText.toLowerCase().includes("easy") || btnText.toLowerCase().includes("1-click")) {
        await easyApplyBtn.click();
        await page.waitForTimeout(2000);

        // Check if a multi-step form appeared
        const formFields = await page.$$('textarea, input[type="text"]:not([type="hidden"])');
        const hasLongForm = formFields.length > 3;

        if (hasLongForm) {
          stats.longForm.push({
            title: title.trim(),
            company: company.trim(),
            url: jobUrl,
          });
          await recordApplication(userId, {
            title: title.trim(),
            company: company.trim(),
            url: jobUrl,
            externalId,
            status: "pending_manual",
            applicationType: "long_form",
          });
          // Close any opened dialog
          await page.keyboard.press("Escape");
        } else {
          // Submit if it's truly simple
          const submitBtn = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            stats.applied++;
            await recordApplication(userId, {
              title: title.trim(),
              company: company.trim(),
              url: jobUrl,
              externalId,
              status: "applied",
              applicationType: "easy_apply",
            });
          } else {
            stats.longForm.push({ title: title.trim(), company: company.trim(), url: jobUrl });
            await recordApplication(userId, {
              title: title.trim(),
              company: company.trim(),
              url: jobUrl,
              externalId,
              status: "pending_manual",
              applicationType: "long_form",
            });
          }
        }
      } else {
        // Standard apply button - mark for manual review
        stats.longForm.push({ title: title.trim(), company: company.trim(), url: jobUrl });
        await recordApplication(userId, {
          title: title.trim(),
          company: company.trim(),
          url: jobUrl,
          externalId,
          status: "pending_manual",
          applicationType: "standard",
        });
      }
    } else {
      // No apply button found - check if there's an external apply link
      const externalApply = await page.$('a[href*="apply"], a:has-text("Apply"), a:has-text("Apply Now")');
      if (externalApply) {
        stats.longForm.push({ title: title.trim(), company: company.trim(), url: jobUrl });
        await recordApplication(userId, {
          title: title.trim(),
          company: company.trim(),
          url: jobUrl,
          externalId,
          status: "pending_manual",
          applicationType: "external",
        });
      } else {
        stats.skipped++;
      }
    }
  } catch (e) {
    stats.errors.push(`Job page error ${jobUrl}: ${(e as Error).message}`);
    stats.skipped++;
  }
}

export async function runWellfoundBot(): Promise<BotStats> {
  const stats: BotStats = {
    applied: 0,
    skipped: 0,
    longForm: [],
    errors: [],
    blocked: false,
    totalSeen: 0,
  };

  if (!WELLFOUND_EMAIL || !WELLFOUND_PASSWORD) {
    stats.errors.push("Missing WELLFOUND_EMAIL or WELLFOUND_PASSWORD env vars");
    return stats;
  }

  const userId = await getSarperUserId();
  const dbAvailable = !!userId;
  const effectiveUserId = userId ?? "00000000-0000-0000-0000-000000000000";
  if (!dbAvailable) {
    stats.errors.push(`DB unavailable or user not found — applications will not be recorded in DB`);
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1280,800",
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
      ignoreHTTPSErrors: true,
    });

    // Hide webdriver property
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const page = await context.newPage();

    const loggedIn = await login(page);
    if (!loggedIn) {
      const blocked = await isBlocked(page);
      if (blocked) {
        stats.errors.push("Wellfound blocked this server IP (datacenter/cloud IP detected). Use a residential proxy.");
      } else {
        stats.errors.push("Login failed - check credentials or Wellfound may require CAPTCHA");
      }
      stats.blocked = true;
    } else {
      await scrapeAndApplyJobs(page, effectiveUserId, stats);
    }

    await context.close();
  } catch (e) {
    stats.errors.push(`Browser error: ${(e as Error).message}`);
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }

  return stats;
}
