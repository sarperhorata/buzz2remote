import { JobSource, RawJob } from "./types";

// 4 companies using Recruitee (from distill export)
const RECRUITEE_COMPANIES = [
  "scholarshipowl","supersummary","cobbleweb","tether",
];

async function fetchRecruiteeJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${company}.recruitee.com/api/offers`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.offers || [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String(job.location || "").toLowerCase();
        const remote = Boolean(job.remote);
        return remote || loc.includes("remote") || loc.includes("anywhere");
      })
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || ""),
        company: String(job.company_name || company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
        location: String(job.location || "Remote"),
        description: String(job.description || ""),
        url: String(job.careers_url || job.url || `https://${company}.recruitee.com/o/${job.slug}`),
        job_type: String(job.employment_type_code || "Full-time"),
        remote_type: "Remote",
        skills: [],
        tags: [job.department, job.category].filter(Boolean).map(String),
        posted_date: job.published_at ? String(job.published_at) : null,
        source: "Recruitee",
        source_url: String(job.careers_url || ""),
        external_id: `recruitee-${company}-${job.id || job.slug || ""}`,
      }));
  } catch {
    return [];
  }
}

export const recruitee: JobSource = {
  name: "Recruitee",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];
    const results = await Promise.allSettled(
      RECRUITEE_COMPANIES.map(fetchRecruiteeJobs)
    );
    for (const r of results) if (r.status === "fulfilled") allJobs.push(...r.value);
    return allJobs.filter((j) => j.title && j.company);
  },
};
