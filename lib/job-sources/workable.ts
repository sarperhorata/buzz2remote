import { JobSource, RawJob } from "./types";

// 21 companies using Workable ATS (from distill export)
const WORKABLE_COMPANIES = [
  "elo","drops","brandbastion","goosechase","baremetrics",
  "io-global","defiant","screenly","cartstack","7pace",
  "glofoxinc","memory","gitbook","student-loan-hero",
  "bluecode","themeisle","seeq","wingieenuygun","hospitable",
];

async function fetchWorkableJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://apply.workable.com/api/v1/widget/accounts/${company}`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String((job.location as Record<string, unknown>)?.city || job.location || "").toLowerCase();
        const remote = Boolean(job.telecommuting);
        return remote || loc.includes("remote") || loc.includes("anywhere");
      })
      .map((job: Record<string, unknown>) => {
        const loc = job.location as Record<string, unknown> | undefined;
        return {
          title: String(job.title || ""),
          company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          location: loc ? String(loc.city || loc.country || "Remote") : "Remote",
          description: String(job.description || ""),
          url: String(job.url || `https://apply.workable.com/${company}/j/${job.shortcode}/`),
          job_type: String(job.employment_type || "Full-time"),
          remote_type: "Remote",
          skills: [],
          tags: [job.department].filter(Boolean).map(String),
          posted_date: job.published_on ? String(job.published_on) : null,
          source: "Workable",
          source_url: String(job.url || `https://apply.workable.com/${company}/j/${job.shortcode}/`),
          external_id: `workable-${company}-${job.shortcode || job.id || ""}`,
        };
      });
  } catch {
    return [];
  }
}

export const workable: JobSource = {
  name: "Workable",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    for (let i = 0; i < WORKABLE_COMPANIES.length; i += 5) {
      const batch = WORKABLE_COMPANIES.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((company) => fetchWorkableJobs(company))
      );
      for (const result of results) {
        if (result.status === "fulfilled") allJobs.push(...result.value);
      }
      if (i + 5 < WORKABLE_COMPANIES.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
