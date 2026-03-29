import { JobSource, RawJob } from "./types";

// 58 remote-first companies using Greenhouse ATS (merged from distill export + curated list)
const GREENHOUSE_COMPANIES = [
  "airbnb","atomicvest","auth0","automattic","axios","bevy","beyondfinance",
  "brex","cameo","cloudflare","coinbase","convertkit","datadog","dbt-labs",
  "deel","discord","downingcapitalgroup","eclinicalsolutions","elastic",
  "exodus54","figma","figure","fulfil","garnerhealth","generalassembly",
  "gitlab","givedirectly","grafana-labs","gusto","hashicorp","inchargeenergy",
  "instacart","linear","mongodb","netlify","notion","pandadoc","pitch",
  "plaid","productpeople","ramp","recharge","reddit","revenuecat","roadie",
  "snyk","sourcegraph91","stripe","supabase","thesis","twilio",
  "userinterviews","vercel","wikimedia","woo","wyndlabs","xapo61","zapier",
];

async function fetchGreenhouseJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs
      .filter((job: Record<string, unknown>) => {
        const loc = String((job.location as Record<string, unknown>)?.name || "").toLowerCase();
        return loc.includes("remote") || loc.includes("anywhere") || loc.includes("distributed");
      })
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || ""),
        company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        location: String((job.location as Record<string, unknown>)?.name || "Remote"),
        description: String(job.content || ""),
        url: String(job.absolute_url || ""),
        job_type: "Full-time",
        remote_type: "Remote",
        skills: [],
        tags: Array.isArray(job.departments)
          ? (job.departments as Array<{ name: string }>).map((d) => d.name)
          : [],
        posted_date: job.updated_at ? String(job.updated_at) : null,
        source: "Greenhouse",
        source_url: String(job.absolute_url || ""),
        external_id: `greenhouse-${company}-${job.id || ""}`,
      }));
  } catch {
    return [];
  }
}

export const greenhouse: JobSource = {
  name: "Greenhouse",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    // Fetch in batches of 8 to avoid rate limiting
    for (let i = 0; i < GREENHOUSE_COMPANIES.length; i += 8) {
      const batch = GREENHOUSE_COMPANIES.slice(i, i + 8);
      const results = await Promise.allSettled(
        batch.map((company) => fetchGreenhouseJobs(company))
      );
      for (const result of results) {
        if (result.status === "fulfilled") allJobs.push(...result.value);
      }
      if (i + 8 < GREENHOUSE_COMPANIES.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
