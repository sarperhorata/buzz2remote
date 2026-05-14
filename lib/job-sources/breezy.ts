import { JobSource, RawJob } from "./types";

// 25 companies using Breezy HR (distill + embedded-ATS detection — see
// scripts/pilot-detect-embedded-ats.ts).
const BREEZY_COMPANIES = [
  "bad-marketing","beter","bondex-app","codigovision","connected-women",
  "cvedia","deca-games","dollar-flight-club","dotsub","freedom-insurance-services",
  "gamurs","ivisa","jatheon-technologies-inc","larvol","padi","parashift-ag",
  "participatory-culture-foundation","remote-year","sciencebuzz",
  "social-discovery-ventures","sortly-inc","ta-monroe","teammelon",
  "the-engine-room","time-doctor",
];

async function fetchBreezyJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${company}.breezy.hr/json`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String((job.location as Record<string, unknown>)?.name || job.location || "").toLowerCase();
        const isRemote = Boolean((job.location as Record<string, unknown>)?.is_remote);
        return isRemote || loc.includes("remote") || loc.includes("anywhere");
      })
      .map((job: Record<string, unknown>) => ({
        title: String(job.name || ""),
        company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        location: String((job.location as Record<string, unknown>)?.name || "Remote"),
        description: String(job.description || ""),
        url: String(job.url || `https://${company}.breezy.hr/p/${job.friendly_id || job.id}`),
        job_type: String((job.type as Record<string, unknown>)?.name || "Full-time"),
        remote_type: "Remote",
        skills: [],
        tags: [job.department, (job.category as Record<string, unknown>)?.name].filter(Boolean).map(String),
        posted_date: job.published_date ? String(job.published_date) : null,
        source: "Breezy",
        source_url: String(job.url || `https://${company}.breezy.hr/p/${job.friendly_id || job.id}`),
        external_id: `breezy-${company}-${job.id || job.friendly_id || ""}`,
      }));
  } catch {
    return [];
  }
}

export const breezy: JobSource = {
  name: "Breezy",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];
    for (let i = 0; i < BREEZY_COMPANIES.length; i += 5) {
      const batch = BREEZY_COMPANIES.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map(fetchBreezyJobs));
      for (const r of results) if (r.status === "fulfilled") allJobs.push(...r.value);
      if (i + 5 < BREEZY_COMPANIES.length) await new Promise((r) => setTimeout(r, 500));
    }
    return allJobs.filter((j) => j.title && j.company);
  },
};
