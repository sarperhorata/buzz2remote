import { JobSource, RawJob } from "./types";

// 30 companies using Freshteam (from distill export)
const FRESHTEAM_COMPANIES = [
  "shuggr","easocare","under25-talent","aavalabs","sheleadsafrica-talent",
  "ultius","lastcallmedia","oml","egannelson","lyfserv",
  "getthru","trendspider","webservicesdesk","construelabs","blanklabel",
  "trovatrip-talent","exchangevalet","ryustaffingservices","innoviavc",
  "jensdev","teetra","flosstech","venubi","closedwon",
  "mhubenterprise","crispyapps","truewhitespace","optimization","tezerak","nil",
];

async function fetchFreshteamJobs(company: string): Promise<RawJob[]> {
  try {
    // Freshteam has a JSON endpoint
    const res = await fetch(
      `https://${company}.freshteam.com/api/job_postings?status=active`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) {
      // Fallback: try the jobs page with JSON accept
      const res2 = await fetch(
        `https://${company}.freshteam.com/jobs?isRemoteLocation=true`,
        { headers: { "Accept": "application/json", "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!res2.ok) return [];
      // If HTML returned, we can't parse it server-side
      const contentType = res2.headers.get("content-type") || "";
      if (!contentType.includes("json")) return [];
      const data = await res2.json();
      return Array.isArray(data) ? data.map(mapJob(company)) : [];
    }

    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const remote = Boolean(job.remote);
        const loc = String(job.location || "").toLowerCase();
        return remote || loc.includes("remote");
      })
      .map(mapJob(company));
  } catch {
    return [];
  }
}

function mapJob(company: string) {
  return (job: Record<string, unknown>): RawJob => ({
    title: String(job.title || ""),
    company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    location: String(job.location || "Remote"),
    description: String(job.description || ""),
    url: `https://${company}.freshteam.com/jobs/${job.id || ""}`,
    job_type: String(job.type || "Full-time"),
    remote_type: "Remote",
    skills: [],
    tags: [(job.department as Record<string, unknown>)?.name, (job.branch as Record<string, unknown>)?.name].filter(Boolean).map(String),
    posted_date: job.created_at ? String(job.created_at) : null,
    source: "Freshteam",
    source_url: `https://${company}.freshteam.com/jobs/${job.id || ""}`,
    external_id: `freshteam-${company}-${job.id || ""}`,
  });
}

export const freshteam: JobSource = {
  name: "Freshteam",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];
    for (let i = 0; i < FRESHTEAM_COMPANIES.length; i += 5) {
      const batch = FRESHTEAM_COMPANIES.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map(fetchFreshteamJobs));
      for (const r of results) if (r.status === "fulfilled") allJobs.push(...r.value);
      if (i + 5 < FRESHTEAM_COMPANIES.length) await new Promise((r) => setTimeout(r, 500));
    }
    return allJobs.filter((j) => j.title && j.company);
  },
};
