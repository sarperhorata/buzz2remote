/**
 * Salary estimation for jobs that don't post a salary.
 *
 * Strategy: take a sample of active jobs in the same broad category
 * (Engineering / Dev, Data / AI, etc. — see lib/job-categories.ts), use
 * salary_min and salary_max where both are populated, and compute p25/median/p75.
 *
 * We DO NOT call this on every job page — only when the job itself has no
 * salary signal. The category is a coarse bucket but it's enough for a
 * "ballpark" hint. Anything finer (level, location) needs a more involved
 * model.
 *
 * Limits we guard:
 *   - Sample of at most 200 jobs to keep the query cheap.
 *   - Require ≥ 10 samples before returning a result (else null).
 *   - Outliers above $1M/yr or below $5k/yr filtered as bad data.
 *
 * Currency: we trust whatever currency the sampled jobs have. Most of the
 * dataset is USD; if the sample is mixed we report the modal currency and
 * fall back to "USD".
 */

import { prisma } from "@/lib/db";
import { CATEGORY_KEYWORDS } from "@/lib/job-categories";

export type SalaryEstimate = {
  min: number;
  max: number;
  median: number;
  sampleSize: number;
  currency: string;
};

const MIN_SAMPLES = 10;
const SAMPLE_LIMIT = 200;
const LOWER_OUTLIER = 5_000;
const UPPER_OUTLIER = 1_000_000;

/** Quantile of a sorted (ascending) numeric array. Linear interpolation. */
function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const w = pos - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

/** Most common currency in a list; ties broken alphabetically. */
function modalCurrency(currencies: Array<string | null>): string {
  const counts = new Map<string, number>();
  for (const c of currencies) {
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  if (counts.size === 0) return "USD";
  let best: { cur: string; n: number } = { cur: "USD", n: -1 };
  for (const [cur, n] of counts) {
    if (n > best.n || (n === best.n && cur < best.cur)) {
      best = { cur, n };
    }
  }
  return best.cur;
}

/**
 * Build a Prisma `where` filter that matches jobs in the given category.
 *
 * We use ILIKE on the title (Prisma's `contains` with insensitive mode)
 * against the category's keywords. This mirrors `classifyJobTitle` —
 * a job title that contains "engineer" or "developer" hits Engineering / Dev.
 *
 * "Other" jobs (no category match) are excluded since we can't sample
 * sensibly without a bucket.
 */
function buildCategoryWhere(category: string) {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords || keywords.length === 0) return null;
  return {
    is_active: true,
    archived: false,
    salary_min: { not: null, gte: LOWER_OUTLIER, lte: UPPER_OUTLIER },
    salary_max: { not: null, gte: LOWER_OUTLIER, lte: UPPER_OUTLIER },
    OR: keywords.map((kw) => ({
      title: { contains: kw, mode: "insensitive" as const },
    })),
  };
}

/**
 * Estimate the salary range for a job based on similar jobs in its category.
 *
 * Returns null when:
 *   - the category is "Other" or unrecognized,
 *   - fewer than MIN_SAMPLES jobs match.
 *
 * The midpoint per job (avg of min and max) drives the percentile bands;
 * this is more robust than computing percentiles on raw min/max separately
 * (the bands would be artificially wide).
 */
export async function estimateSalary(
  _jobTitle: string,
  jobCategory: string
): Promise<SalaryEstimate | null> {
  const where = buildCategoryWhere(jobCategory);
  if (!where) return null;

  const samples = await prisma.jobs.findMany({
    where,
    select: { salary_min: true, salary_max: true, salary_currency: true },
    take: SAMPLE_LIMIT,
    // No need for orderBy — Prisma will give us a stable-ish slice and the
    // statistics are insensitive to order.
  });

  if (samples.length < MIN_SAMPLES) return null;

  const midpoints: number[] = [];
  const mins: number[] = [];
  const maxes: number[] = [];
  const currencies: Array<string | null> = [];
  for (const s of samples) {
    if (s.salary_min == null || s.salary_max == null) continue;
    if (s.salary_min > s.salary_max) continue; // bad data
    midpoints.push((s.salary_min + s.salary_max) / 2);
    mins.push(s.salary_min);
    maxes.push(s.salary_max);
    currencies.push(s.salary_currency);
  }

  if (midpoints.length < MIN_SAMPLES) return null;

  midpoints.sort((a, b) => a - b);
  mins.sort((a, b) => a - b);
  maxes.sort((a, b) => a - b);

  // Use the 25th percentile of the per-job MINs and the 75th percentile of
  // the per-job MAXes as the displayed band. This gives a range that
  // reflects what employers actually post, not just the midpoint.
  const min = Math.round(quantile(mins, 0.25));
  const max = Math.round(quantile(maxes, 0.75));
  const median = Math.round(quantile(midpoints, 0.5));

  return {
    min,
    max,
    median,
    sampleSize: midpoints.length,
    currency: modalCurrency(currencies),
  };
}

/**
 * Compact "$92k" style formatter. Below $10k uses raw value.
 */
export function formatSalaryShort(amount: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  const suffix = symbol ? "" : ` ${currency}`;
  if (amount >= 10_000) {
    const k = amount / 1000;
    const display = k >= 100 ? Math.round(k).toString() : k.toFixed(0);
    return `${symbol}${display}k${suffix}`;
  }
  return `${symbol}${amount.toLocaleString()}${suffix}`;
}
