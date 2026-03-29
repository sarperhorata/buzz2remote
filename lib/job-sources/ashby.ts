import { JobSource, RawJob } from "./types";

// 15 companies using Ashby ATS (from distill export)
const ASHBY_COMPANIES = [
  "deel","eightsleep","stedi","gruntwork","keyrock",
  "talentdisruptors","li.fi","oplabs","ens-labs","cargo-one",
  "signalfire","smallpdf","outliant","acorns",
];

async function fetchAshbyJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=true`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String(job.location || "").toLowerCase();
        const isRemote = Boolean(job.isRemote);
        return isRemote || loc.includes("remote") || loc.includes("anywhere");
      })
      .map((job: Record<string, unknown>) => {
        const comp = (job.compensation as Record<string, unknown>) || {};
        return {
          title: String(job.title || ""),
          company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          location: String(job.location || "Remote"),
          description: String(job.descriptionHtml || job.descriptionPlain || ""),
          url: `https://jobs.ashbyhq.com/${company}/${job.id}`,
          salary_min: comp.compensationTierSummary ? null : null,
          salary_max: null,
          job_type: String(job.employmentType || "Full-time"),
          remote_type: "Remote",
          skills: [],
          tags: [job.department, job.team].filter(Boolean).map(String),
          posted_date: job.publishedAt ? String(job.publishedAt) : null,
          source: "Ashby",
          source_url: `https://jobs.ashbyhq.com/${company}/${job.id}`,
          external_id: `ashby-${company}-${job.id || ""}`,
        };
      });
  } catch {
    return [];
  }
}

export const ashby: JobSource = {
  name: "Ashby",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    for (let i = 0; i < ASHBY_COMPANIES.length; i += 5) {
      const batch = ASHBY_COMPANIES.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((company) => fetchAshbyJobs(company))
      );
      for (const result of results) {
        if (result.status === "fulfilled") allJobs.push(...result.value);
      }
      if (i + 5 < ASHBY_COMPANIES.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
