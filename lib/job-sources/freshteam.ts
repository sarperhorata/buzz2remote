import { JobSource, RawJob } from "./types";

// 63 companies using Freshteam (existing 30 + 33 discovered via scripts/discover-ats-slugs.ts).
// Note: Freshteam's JSON API now requires authentication (returns 401/403),
// so we scrape the public HTML jobs page instead. Each listing renders as
// <a href="/jobs/<id>/<slug>">…title + snippet…</a>.
const FRESHTEAM_COMPANIES = [
  "7peakssoftware-hr","aavalabs","acresoftware-1629290987543","antino","blanklabel",
  "bridgeintel","bungeetech-talent","closedwon","codingal","conferecartoes-team",
  "construelabs","crispyapps","dhan","easocare","egannelson",
  "eplane-team","exchangevalet","flosstech","getflowpath","getstimulus-talent",
  "getthru","haptik","honest","innoviavc","jensdev",
  "jolera","lastcallmedia","leaningtech","leapfinance","lendsqr",
  "locus","lyfserv","mhubenterprise","mudrex","nil",
  "oml","optimization","pandora-people","paxcom","pesapal",
  "platformatory-1632407309031","ryustaffingservices","sayint","sciera","sedintechnologies-talent",
  "sheleadsafrica-talent","shuggr","smallcase","sonicelectronix-talent","superlayer-1634135852323",
  "talent360","teetra","tezerak","thesoftwarepractice","trendspider",
  "trovatrip-talent","truewhitespace","ukirama","ultius","under25-talent",
  "univers","venubi","webservicesdesk",
];

// Freshteam renders each job as:
//   <a href="/jobs/<id>/<slug>" ... data-portal-location="..." data-portal-remote-location="true|false">
//     <div class="job-title">Title</div>
//     <div class="location-info">Location<br/>Job Type</div>
//   </a>
// We capture the full anchor block, then pull structured fields by name.
const JOB_BLOCK_RE =
  /<a[^>]*href="(\/jobs\/([A-Za-z0-9_-]+)\/[a-z0-9-]+)"[^>]*?(?:data-portal-location="([^"]*)")?[^>]*?(?:data-portal-remote-location="?(true|false)"?)?[^>]*>([\s\S]*?)<\/a>/g;

function stripTags(s: string): string {
  return s
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagText(html: string, className: string): string {
  const re = new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`, "i");
  const m = re.exec(html);
  return m ? stripTags(m[1]) : "";
}

function titleizeCompany(slug: string): string {
  return slug
    .replace(/-talent$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchFreshteamJobs(company: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${company}.freshteam.com/jobs`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return [];
    const html = await res.text();

    const companyName = titleizeCompany(company);
    const seen = new Set<string>();
    const jobs: RawJob[] = [];

    let match: RegExpExecArray | null;
    while ((match = JOB_BLOCK_RE.exec(html)) !== null) {
      const [, path, id, portalLocation, portalRemote, inner] = match;
      if (seen.has(id)) continue;
      seen.add(id);

      const title = extractTagText(inner, "job-title");
      const locationInfo = extractTagText(inner, "location-info");
      if (!title) continue;

      // location-info reads "City, Country Full Time" — split on the job-type
      // suffix to keep only the geographical part.
      const location =
        (portalLocation && portalLocation.trim()) ||
        locationInfo.replace(/\b(Full\s*Time|Part\s*Time|Contract|Internship|Temporary)\b.*$/i, "").trim();
      const isRemote =
        portalRemote === "true" ||
        /remote|anywhere|distributed|work from home/i.test(`${title} ${location}`);
      const jobTypeMatch = locationInfo.match(
        /(Full\s*Time|Part\s*Time|Contract|Internship|Temporary)/i
      );

      const url = `https://${company}.freshteam.com${path}`;
      jobs.push({
        title,
        company: companyName,
        location: location || (isRemote ? "Remote" : ""),
        description: "",
        url,
        job_type: jobTypeMatch ? jobTypeMatch[1].replace(/\s+/g, "-") : "Full-time",
        remote_type: isRemote ? "Remote" : undefined,
        skills: [],
        tags: [],
        posted_date: null,
        source: "Freshteam",
        source_url: url,
        external_id: `freshteam-${company}-${id}`,
      });
    }

    // We intentionally accept non-remote jobs since many Freshteam tenants
    // are remote-first to begin with — the global remote filter happens
    // upstream in the importer.
    return jobs;
  } catch {
    return [];
  }
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
