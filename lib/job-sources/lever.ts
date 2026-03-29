import { JobSource, RawJob } from "./types";

// Top remote-first companies using Lever ATS
const LEVER_COMPANIES = [
  "Netflix", "shopify", "spotify", "databricks", "anthropic",
  "openai", "scale", "huggingface", "replit", "wiz-inc",
  "confluent", "airtable", "webflow", "retool", "loom",
  "miro", "clickup", "calendly", "gong-io", "rippling",
  "anduril", "palantir", "lacework", "cockroachlabs", "timescale",
];

async function fetchLeverJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" } }
    );
    if (!res.ok) return [];

    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String(job.categories && (job.categories as Record<string, unknown>).location || "").toLowerCase();
        const title = String(job.text || "").toLowerCase();
        return loc.includes("remote") || loc.includes("anywhere") || title.includes("remote");
      })
      .map((job: Record<string, unknown>) => {
        const cats = (job.categories || {}) as Record<string, unknown>;
        return {
          title: String(job.text || ""),
          company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          location: String(cats.location || "Remote"),
          description: String(job.descriptionPlain || job.description || ""),
          url: String(job.hostedUrl || ""),
          job_type: String(cats.commitment || "Full-time"),
          remote_type: "Remote",
          skills: [],
          tags: [cats.team, cats.department].filter(Boolean).map(String),
          posted_date: job.createdAt ? new Date(Number(job.createdAt)).toISOString() : null,
          source: "Lever",
          source_url: String(job.hostedUrl || ""),
          external_id: `lever-${company}-${job.id || ""}`,
        };
      });
  } catch {
    return [];
  }
}

export const lever: JobSource = {
  name: "Lever",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    for (let i = 0; i < LEVER_COMPANIES.length; i += 5) {
      const batch = LEVER_COMPANIES.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((company) => fetchLeverJobs(company))
      );
      for (const result of results) {
        if (result.status === "fulfilled") {
          allJobs.push(...result.value);
        }
      }
      if (i + 5 < LEVER_COMPANIES.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
