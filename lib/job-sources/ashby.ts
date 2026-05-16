import { JobSource, RawJob } from "./types";

// 232 companies using Ashby ATS. Sources:
//   - distill + embedded-ATS detection (scripts/pilot-detect-embedded-ats.ts) — initial 29
//   - remoteintech/remote-jobs + GitHub code search
//     (scripts/discover-ats-slugs.ts) — +203 new slugs. Ashby is dominant in
//     the AI/SaaS startup space (OpenAI, ElevenLabs, Vanta, Whatnot, etc.).
const ASHBY_COMPANIES = [
  "1password","abridge","acorns","airgarage","airgoods",
  "alan","alembic","allium","ameba","andela",
  "anima","ankorstore","ashby","ashby-embed-demo-org","assembledhq",
  "astera","astronomer","atomic-financial","atomicsemi","aurorasolar",
  "benepass","betterup","bevel","bitnomial","blacksmith",
  "blockworks","blueberrypediatrics","brainly","buffer","buildwithfern",
  "cambly","candidhealth","cantina","capchase","cargado",
  "cargo-one","category-labs","chaidiscovery","chainlink-labs","charge-robotics",
  "checkly","chestnut","chilipiper","claylabs","cleric",
  "close","cloudtrucks","cohere","comity","company",
  "conduit","continue","crusoe","cruxclimate","cursor",
  "d-matrix","dailypay","dandy","datologyai","dave",
  "deel","deepl","dialogueai","distyl","docker",
  "dourolabs","duck-duck-go","edlink","eightsleep","elevenlabs",
  "elicit","eliseai","elliptic","ema","ens-labs",
  "etched","extend","fathom","feldera","firecrawl",
  "fizz","fluidstack","frontcareers","genmo","gigaml",
  "glimpse","gorgias","goteleport","gptzero","graphite",
  "gruntwork","hadrian-automation","handshake","harmonic","harvey",
  "helpscout","higgsfieldai","hims-and-hers","hiya","homevision",
  "hopper","humaans","imprint","instructure","ironcladhq",
  "joor","keyrock","kindred","kombo","konvu",
  "langfuse","li.fi","lightdash","linear","liquid",
  "livekit","llamaindex","luxor","magical","mapbox",
  "matterworks","mazedesign","mechanize","medal","meridianlink",
  "middesk","mirage","modal","monterra","mural",
  "mux","mystenlabs","n8n","nango","netboxlabs",
  "netgear","nethermind","nextmatter","nomic","northslope-technologies",
  "notable","notion","nuna","odyssey","onecrew",
  "onoshealth","ontic","openai","openrouter","oplabs",
  "opusclip","oscilar","outliant","oyster","parallel",
  "parker","patreon","peec","percona","permitflow",
  "perplexity","persona","pleo","polygon-labs","polymarket",
  "prefect","primer","prior-labs","procurify","propelus",
  "pylon","pylon-labs","quora","railway","ramp",
  "readme","reflectionai","render","replit","revenuecat",
  "rillet","rula","sahara","salesjack","saronic",
  "savvy","scholarly","scribdinc","sentient","serval",
  "sesame","sierra","siftstack","signalfire","signoz",
  "sigp","sleeper","smallpdf","sobek-ai","solace",
  "solink","stedi","stellar","stickermule","strava",
  "stream","stytch","substack","suno","supabase",
  "tabs","talentdisruptors","talos-trading","tavahealth","tracer",
  "tribe-xyz","truelogic","trychroma","unto-labs","upside",
  "valon","vanta","virtahealth","voladynamics","voldex",
  "watershed","whatnot","wirescreen","workos","zapier",
  "zencastr","zippymh",
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
