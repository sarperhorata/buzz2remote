import { JobSource, RawJob } from "./types";

// 102 companies using Lever ATS. Sources:
//   - distill + embedded-ATS detection on direct career pages
//     (scripts/pilot-detect-embedded-ats.ts) — initial 69
//   - remoteintech/remote-jobs + GitHub code search
//     (scripts/discover-ats-slugs.ts) — +33 new slugs
const LEVER_COMPANIES = [
  "15five","achievers","aerostrat","airalo","airtable",
  "anduril","anomali","ansatzcapital","anthropic","appen-2",
  "aurora-dev","bhvr","bigtime","binance","bluecatnetworks",
  "blum","calendly","caremessage","caseware","certik",
  "circonus","clerky","clickup","cockroachlabs","codecombat",
  "colibrigroup","collabora","confluent","contentsquare","databricks",
  "deepgenomics","dnc","elevatelabs","envato-2","espresso",
  "extremenetworks","findem","fireflyon","formulamonks","gate.io",
  "geocomply-2","girlswhocode","globalstrategygroup","gong-io","heetch",
  "hermeus","huggingface","innocraft","jito","jumpcloud",
  "kong","kraken","kungfu","lacework","lendbuzz",
  "loadsmart","logrocket","loom","magnetforensics","marcopolo",
  "miro","myollie","netflix","offchainlabs","olo",
  "openai","palantir","peerspace","perforce","picus",
  "prominentedge","rainforest","rarible","replit","retool",
  "rippling","roofstacks","sanabenefits","scale","seedify-fund",
  "seerinteractive","shopify","skillshare","sonatype","spotify",
  "spreedly","strapi","super-com","superside","teamsnap",
  "telesat","thinkingbox","threecolts","timescale","tinybird",
  "tokenmetrics","unify","valkyrietrading","vrchat","webflow",
  "welocalize","wiz-inc",
];

async function fetchLeverJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const cats = (job.categories || {}) as Record<string, unknown>;
        const loc = String(cats.location || "").toLowerCase();
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

    for (let i = 0; i < LEVER_COMPANIES.length; i += 8) {
      const batch = LEVER_COMPANIES.slice(i, i + 8);
      const results = await Promise.allSettled(
        batch.map((company) => fetchLeverJobs(company))
      );
      for (const result of results) {
        if (result.status === "fulfilled") allJobs.push(...result.value);
      }
      if (i + 8 < LEVER_COMPANIES.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
