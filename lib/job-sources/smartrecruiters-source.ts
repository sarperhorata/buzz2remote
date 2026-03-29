import { JobSource, RawJob } from "./types";

// 6 companies using SmartRecruiters (from distill export)
const SMARTRECRUITERS_COMPANIES = [
  "PurpleRain","IntrepidVentures","TreehouseStrategyAndCommunicatio",
  "Freshworks","Bitoasis",
];

async function fetchSmartRecruiterJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.content || [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String((job.location as Record<string, unknown>)?.remote ? "remote" : "").toLowerCase();
        const locName = String((job.location as Record<string, unknown>)?.city || "").toLowerCase();
        return loc === "remote" || locName.includes("remote") || Boolean((job.location as Record<string, unknown>)?.remote);
      })
      .map((job: Record<string, unknown>) => {
        const loc = job.location as Record<string, unknown> | undefined;
        return {
          title: String(job.name || ""),
          company: String((job.company as Record<string, unknown>)?.name || company),
          location: loc ? String(loc.city || loc.country || "Remote") : "Remote",
          description: "",
          url: String(job.ref || `https://jobs.smartrecruiters.com/${company}/${job.id}`),
          job_type: String((job.typeOfEmployment as Record<string, unknown>)?.label || "Full-time"),
          remote_type: "Remote",
          skills: [],
          tags: [(job.department as Record<string, unknown>)?.label, (job.function as Record<string, unknown>)?.label].filter(Boolean).map(String),
          posted_date: job.releasedDate ? String(job.releasedDate) : null,
          source: "SmartRecruiters",
          source_url: String(job.ref || ""),
          external_id: `smartrecruiters-${company}-${job.id || ""}`,
        };
      });
  } catch {
    return [];
  }
}

export const smartrecruiters: JobSource = {
  name: "SmartRecruiters",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];
    const results = await Promise.allSettled(
      SMARTRECRUITERS_COMPANIES.map(fetchSmartRecruiterJobs)
    );
    for (const r of results) if (r.status === "fulfilled") allJobs.push(...r.value);
    return allJobs.filter((j) => j.title && j.company);
  },
};
