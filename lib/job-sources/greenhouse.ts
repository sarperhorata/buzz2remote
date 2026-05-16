import { JobSource, RawJob } from "./types";

// 182 companies using Greenhouse ATS. Sources merged together:
//   - distill catalogue + curated list (initial 72)
//   - embedded-ATS sweep on 297 direct career pages (scripts/pilot-detect-embedded-ats.ts)
//   - remoteintech/remote-jobs awesome-list + GitHub code search
//     (scripts/discover-ats-slugs.ts) → +110 new slugs
// Many "direct" career pages turn out to be Greenhouse iframes under the hood.
const GREENHOUSE_COMPANIES = [
  "ada18","aestudio","affirm","ahrefsjobs","airbnb",
  "anthropic","appian","appliedintuition","applovin","aquaticcapitalmanagement",
  "arcadiacareers","ardentmc","arizeai","atomicvest","auth0",
  "automattic","axios","azragames","b12","banyansoftware",
  "bevy","beyond","beyondfinance","billcom","bitgo",
  "blastpoint","bosapropertiesinc","boulevard","brex","bridgewater89",
  "bugcrowd","bungie","buzzfeed","cameo","canonical",
  "cartesiansystems","circleci","civicactions","cleo","cloudflare",
  "coinbase","consensys","contentful","convertkit","cresta",
  "customerio","databricks","datadog","dbt-labs","dbtlabsinc",
  "deel","deliveryassociates","dept","dialpad","diligentcorporation",
  "disco","discord","doubleverify","downingcapitalgroup","drweng",
  "dunnhumby","duolingo","eclinicalsolutions","elastic","emarketer",
  "exodus54","figma","figure","figureai","fiveringsllc",
  "flagshippioneeringinc","flexport","fulfil","garnerhealth","generalassembly",
  "genevatrading","geotab","gitlab","givedirectly","grafana-labs",
  "grafanalabs","guardsquare","gusto","hashicorp","headway",
  "inchargeenergy","instacart","intercom","invisibletech","khanacademy",
  "kivaorg","konradgroup","leagueinc","linear","mediabrands",
  "mercury","mochihealth","modernhealth","mongodb","monzo",
  "motional","mwinternshipprogram","nationalpublicradioinc","nationbuilder","nearform",
  "netlify","notion","pagerduty","pandadoc","pathward",
  "paypay","pilothq","pitch","pitchbookdata","plaid",
  "point72","productpeople","prove","radixuniversity","raft",
  "ramp","recharge","reddit","remotecom","revenuecat",
  "roadie","robinhood","rocketlab","sagent","samsungresearchamericainternship",
  "scout24","securityscorecard","seesaw","sezzle","shakepay",
  "singlestore","skhynixmemorysolutionsamericainc","smartling","snyk","sourcegraph91",
  "spacex","speechify","stackblitz","stone","stripe",
  "suki","supabase","synthesishealth","systemstechnologyresearch","temporaltechnologies",
  "teravision","thealleninstitute","thenewyorktimes","thesis","tide",
  "togetherwork","transmarketgroup","tudorgroup","twilio","udacity",
  "upgrade","userinterviews","vardaspace","vercel","verkada",
  "verramobility","virtu","visiersolutionsinc","voxmedia","wargamingen",
  "warp","wehrtyou","wikimedia","woo","wooga",
  "wpp","wyndlabs","xai","xapo61","zapier",
  "zupinnovation","zyngacareers",
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
