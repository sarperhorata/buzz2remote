import { JobSource, RawJob } from "./types";

/**
 * PinpointHQ (UK-based modern ATS, common with mid-stage tech).
 *
 * STATUS: SKELETON ONLY — not currently enabled.
 *
 * Verified 2026-05-14:
 *   - https://{slug}.pinpointhq.com/jobs.json  → 404 (endpoint was
 *     deprecated)
 *   - https://{slug}.pinpointhq.com/  → 200 HTML, but jobs are rendered
 *     CLIENT-SIDE via JS calling Pinpoint's authenticated API at
 *     api.pinpointhq.com. The public page works only because the JS
 *     widget carries a workspace-scoped token at runtime.
 *   - api.pinpointhq.com requires a per-workspace API key issued by the
 *     hiring company → we can't acquire one ourselves.
 *
 * Conclusion: without per-company API keys or a headless-browser render
 * step, PinpointHQ public boards cannot be scraped server-side. Distill
 * only has 2 hits (knack, safetywing) — low ROI to add a Playwright
 * pipeline just for them.
 *
 * Skeleton kept here so a future implementation can drop in once we
 * have either API keys (unlikely) or a Playwright job worker (planned
 * for Wellfound bot anyway).
 */
const PINPOINT_COMPANIES: Array<string> = [];

async function fetchPinpointJobs(slug: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${slug}.pinpointhq.com/jobs.json`,
      { headers: { "User-Agent": "Buzz2Remote/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      id: number | string;
      title?: string;
      department?: string;
      location?: string;
      url?: string;
      description?: string;
      employment_type?: string;
      created_at?: string;
      // PinpointHQ also exposes a `salary` block on some plans.
      salary_min?: number;
      salary_max?: number;
      salary_currency?: string;
    }>;
    const company = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    return data
      .map((j) => ({
        title: String(j.title ?? "").trim(),
        company,
        location: String(j.location ?? "Remote"),
        description: String(j.description ?? ""),
        url: String(j.url ?? `https://${slug}.pinpointhq.com/`),
        salary: null,
        salary_min: j.salary_min ?? null,
        salary_max: j.salary_max ?? null,
        salary_currency: j.salary_currency ?? undefined,
        job_type: String(j.employment_type ?? "Full-time"),
        remote_type: /remote/i.test(String(j.location ?? "")) ? "Remote" : undefined,
        experience_level: undefined,
        skills: [],
        tags: j.department ? [j.department] : [],
        posted_date: j.created_at ?? null,
        source: "PinpointHQ",
        source_url: `https://${slug}.pinpointhq.com/`,
        external_id: `pinpointhq-${slug}-${j.id}`,
      }))
      .filter((j) => j.title && j.company);
  } catch {
    return [];
  }
}

export const pinpointhq: JobSource = {
  name: "PinpointHQ",
  async fetch(): Promise<RawJob[]> {
    if (PINPOINT_COMPANIES.length === 0) return [];
    const all: RawJob[] = [];
    for (let i = 0; i < PINPOINT_COMPANIES.length; i += 4) {
      const batch = PINPOINT_COMPANIES.slice(i, i + 4);
      const results = await Promise.allSettled(batch.map(fetchPinpointJobs));
      for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
    }
    return all;
  },
};
