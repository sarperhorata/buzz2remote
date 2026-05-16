import { JobSource, RawJob } from "./types";

// 67 companies using Breezy HR. Sources:
//   - distill + embedded-ATS detection (scripts/pilot-detect-embedded-ats.ts) — initial 25
//   - awesome-list + GitHub code search (scripts/discover-ats-slugs.ts) — +42 new slugs
const BREEZY_COMPANIES = [
  "1tap-by-receipt-bank","acled","antithesis","artefactual-systems","avantos",
  "bad-marketing","beatdapp","beter","binary-star","boldare",
  "bondex-app","canoo","caribou","chatie","city-report-inc",
  "codigovision","combient","connected-women","connexa","cove",
  "cvedia","data-world","datadems","deca-games","degate",
  "dex-labs","dollar-flight-club","dotsub","ecostage","fr8-revolution",
  "freedom-insurance-services","gaggle","gamurs","instana","ivisa",
  "jatheon-technologies-inc","labcodes-software-studio","larvol","llamaindex","mylo",
  "naturemetrics","netsync-network-solutions","pactsafe-inc","padi","pagely",
  "parashift-ag","participatory-culture-foundation","paystack","quansight","rabbitmart",
  "remote-year","sciencebuzz","setter","shiphero","skillcrush",
  "social-discovery-ventures","sortly-inc","spruce-systems","sumeru-equity-partners","ta-monroe",
  "teammelon","telespazio-be","textile","the-engine-room","the-looma-project",
  "time-doctor","vigilant",
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
