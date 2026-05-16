/**
 * ATS Slug Discovery — Phase D (awesome lists) + Phase B (GitHub code search)
 *
 * GOAL: Find companies hosted on Greenhouse, Lever, Ashby, Workable, Breezy,
 * Recruitee, Freshteam, BambooHR, Personio, SmartRecruiters, Teamtailor that
 * we DON'T already have in our hardcoded slug arrays. The cron pipeline picks
 * up new slugs automatically once you merge them into lib/job-sources/*.ts.
 *
 * PHASE D — remoteintech/remote-jobs awesome-list:
 *   Clone the repo, parse 878 company `.md` files, extract `careers_url` for
 *   remote-friendly / fully-remote companies, fetch the HTML, detect embedded
 *   ATS via the same regex used by pilot-detect-embedded-ats.ts.
 *
 * PHASE B — GitHub code search:
 *   For each ATS URL pattern, search public repos (gh api search/code) and
 *   extract slugs from matching files. Authenticated via gh CLI (~5k/hr).
 *
 * OUTPUT: /tmp/discovered-ats/{ats}.txt — sorted unique slugs NOT already in
 * lib/job-sources/{ats}.ts. Each slug is then validated by hitting the ATS
 * API and confirming it returns >=1 remote-friendly job.
 *
 * Cost: ~10–15 min wall-clock for D (878 HTML fetches), ~2–3 min for B.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

// ─── 1. ATS DETECTION REGEX (copied from pilot-detect-embedded-ats.ts) ───

interface AtsDetection {
  ats: string;
  slug: string;
}

function detectAts(body: string): AtsDetection | null {
  // Greenhouse
  let m = body.match(/greenhouse\.io\/embed\/job_board\?for=([a-z0-9-]+)/i);
  if (m) return { ats: "Greenhouse", slug: m[1] };
  m = body.match(/boards-api\.greenhouse\.io\/v1\/boards\/([a-z0-9-]+)\//i);
  if (m) return { ats: "Greenhouse", slug: m[1] };
  m = body.match(/boards\.greenhouse\.io\/([a-z0-9-]+)/i);
  if (m) return { ats: "Greenhouse", slug: m[1] };
  m = body.match(/job-boards\.greenhouse\.io\/([a-z0-9-]+)/i);
  if (m) return { ats: "Greenhouse", slug: m[1] };

  // Lever
  m = body.match(/jobs\.lever\.co\/([a-z0-9-]+)/i);
  if (m) return { ats: "Lever", slug: m[1] };
  m = body.match(/api\.lever\.co\/v0\/postings\/([a-z0-9-]+)/i);
  if (m) return { ats: "Lever", slug: m[1] };

  // Ashby
  m = body.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/);
  if (m) return { ats: "Ashby", slug: m[1] };
  m = body.match(/api\.ashbyhq\.com\/posting-api\/job-board\/([a-zA-Z0-9-]+)/);
  if (m) return { ats: "Ashby", slug: m[1] };

  // Workable
  m = body.match(/apply\.workable\.com\/([a-z0-9-]+)/i);
  if (m) return { ats: "Workable", slug: m[1] };
  m = body.match(/workable\.com\/api\/(?:v1\/)?accounts\/([a-z0-9-]+)/i);
  if (m) return { ats: "Workable", slug: m[1] };

  // Breezy: COMPANY.breezy.hr
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.breezy\.hr/i);
  if (m) return { ats: "Breezy", slug: m[1] };

  // Recruitee
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.recruitee\.com/i);
  if (m) return { ats: "Recruitee", slug: m[1] };

  // SmartRecruiters
  m = body.match(/smartrecruiters\.com\/v1\/companies\/([A-Za-z0-9-]+)/);
  if (m) return { ats: "SmartRecruiters", slug: m[1] };
  m = body.match(/careers\.smartrecruiters\.com\/([A-Za-z0-9-]+)/);
  if (m) return { ats: "SmartRecruiters", slug: m[1] };

  // Freshteam
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.freshteam\.com/i);
  if (m) return { ats: "Freshteam", slug: m[1] };

  // BambooHR
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.bamboohr\.com/i);
  if (m) return { ats: "BambooHR", slug: m[1] };

  // Personio
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.jobs\.personio\.(?:com|de)/i);
  if (m) return { ats: "Personio", slug: m[1] };

  // Teamtailor
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.teamtailor\.com/i);
  if (m) return { ats: "Teamtailor", slug: m[1] };

  // PinpointHQ
  m = body.match(/\b([a-z0-9][a-z0-9-]+)\.pinpointhq\.com/i);
  if (m) return { ats: "PinpointHQ", slug: m[1] };

  return null;
}

// ─── 2. EXISTING HARDCODED SLUGS (dedup against these) ───────────────────

/** Pull the slug array literal out of each ATS source file. We treat any
 *  bare quoted string inside the file as a slug candidate — these files all
 *  follow the same pattern (one const array literal at the top).            */
function loadExistingSlugs(): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  const files = [
    ["Greenhouse", "lib/job-sources/greenhouse.ts"],
    ["Lever", "lib/job-sources/lever.ts"],
    ["Ashby", "lib/job-sources/ashby.ts"],
    ["Workable", "lib/job-sources/workable.ts"],
    ["Breezy", "lib/job-sources/breezy.ts"],
    ["Freshteam", "lib/job-sources/freshteam.ts"],
    ["SmartRecruiters", "lib/job-sources/smartrecruiters-source.ts"],
    ["Recruitee", "lib/job-sources/recruitee-source.ts"],
    ["Personio", "lib/job-sources/personio.ts"],
    ["BambooHR", "lib/job-sources/bamboohr.ts"],
    ["Teamtailor", "lib/job-sources/teamtailor.ts"],
    ["PinpointHQ", "lib/job-sources/pinpointhq.ts"],
  ];
  for (const [ats, path] of files) {
    map[ats] = new Set();
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf-8");
    // Extract content of the FIRST array literal (the slug list)
    const arrayMatch = text.match(/=\s*\[([\s\S]*?)\]/);
    if (!arrayMatch) continue;
    const matches = arrayMatch[1].matchAll(/"([a-zA-Z0-9-_.]+)"/g);
    for (const mm of matches) {
      const slug = mm[1].toLowerCase().trim();
      // Filter out things that obviously aren't slugs (URLs, locales, etc.)
      if (slug.length < 2 || slug.length > 50) continue;
      if (slug.includes(".") || slug.includes("/")) continue;
      map[ats].add(slug);
    }
  }
  return map;
}

// ─── 3. PHASE D: PARSE remoteintech/remote-jobs ───────────────────────────

const REMOTE_JOBS_DIR = "/tmp/remote-jobs/src/companies";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface CompanyEntry {
  slug: string;
  careers_url: string;
  remote_policy: string;
  source: "awesome-list" | "github-search";
}

function loadCompaniesFromAwesomeList(): CompanyEntry[] {
  if (!existsSync(REMOTE_JOBS_DIR)) {
    throw new Error(
      `${REMOTE_JOBS_DIR} not found. Run: gh repo clone remoteintech/remote-jobs /tmp/remote-jobs -- --depth 1`
    );
  }
  const files = readdirSync(REMOTE_JOBS_DIR).filter((f) => f.endsWith(".md"));
  const companies: CompanyEntry[] = [];
  for (const f of files) {
    const text = readFileSync(`${REMOTE_JOBS_DIR}/${f}`, "utf-8");
    // Extract YAML frontmatter (first --- block)
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const lines = fm[1].split("\n");
    const get = (k: string) => {
      const ln = lines.find((l) => l.startsWith(`${k}:`));
      return ln?.split(":").slice(1).join(":").trim().replace(/^"|"$/g, "") ?? "";
    };
    const slug = get("slug") || f.replace(/\.md$/, "");
    const careers_url = get("careers_url") || get("website");
    const remote_policy = get("remote_policy");
    // Filter: only remote-friendly / fully-remote
    if (!careers_url) continue;
    if (remote_policy && !/(remote|distributed)/i.test(remote_policy)) continue;
    companies.push({ slug, careers_url, remote_policy, source: "awesome-list" });
  }
  return companies;
}

// ─── 4. PHASE B: GITHUB CODE SEARCH ───────────────────────────────────────

interface AtsSearchPattern {
  ats: string;
  query: string; // Google-style query for `gh api search/code`
}

const GH_QUERIES: AtsSearchPattern[] = [
  { ats: "Greenhouse", query: "boards.greenhouse.io extension:md" },
  { ats: "Lever", query: '"jobs.lever.co" extension:md' },
  { ats: "Ashby", query: '"jobs.ashbyhq.com" extension:md' },
  { ats: "Workable", query: '"apply.workable.com" extension:md' },
  { ats: "Breezy", query: '".breezy.hr" extension:md' },
  { ats: "Recruitee", query: '".recruitee.com" extension:md' },
  { ats: "Freshteam", query: '".freshteam.com" extension:md' },
  { ats: "BambooHR", query: '".bamboohr.com/careers" extension:md' },
  { ats: "Personio", query: '".jobs.personio.com" extension:md' },
  { ats: "Teamtailor", query: '".teamtailor.com" extension:md' },
];

interface GhSearchHit {
  path: string;
  repository: { full_name: string };
  // We don't get the matched text from /search/code, we need to fetch the file
  url: string;
  // git_url + html_url + score, etc.
}

/** Fetch the raw text of a GH search hit so we can run regex over it. */
async function fetchGhRaw(hit: GhSearchHit): Promise<string | null> {
  // hit.url looks like https://api.github.com/repositories/<id>/contents/<path>?ref=<sha>
  try {
    const j = execSync(`gh api ${JSON.stringify(hit.url.replace("https://api.github.com", ""))}`, {
      encoding: "utf-8",
      timeout: 10_000,
    });
    const data = JSON.parse(j) as { content?: string; encoding?: string };
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
  } catch {
    // Rate limit, 404, etc. — skip.
  }
  return null;
}

async function searchGithubForAts(pattern: AtsSearchPattern, limit: number): Promise<Set<string>> {
  const slugs = new Set<string>();
  console.log(`\n[gh-search] ${pattern.ats}: querying "${pattern.query}"`);
  let totalHits = 0;
  let page = 1;
  while (totalHits < limit) {
    const q = encodeURIComponent(pattern.query);
    let raw: string;
    try {
      raw = execSync(
        `gh api -H 'Accept: application/vnd.github.v3+json' "search/code?q=${q}&per_page=30&page=${page}"`,
        { encoding: "utf-8", timeout: 15_000 }
      );
    } catch (err) {
      console.log(`  page ${page} failed (${(err as Error).message.slice(0, 80)})`);
      break;
    }
    const data = JSON.parse(raw) as { items?: GhSearchHit[]; total_count?: number };
    const items = data.items ?? [];
    if (items.length === 0) break;
    for (const hit of items) {
      totalHits++;
      const body = await fetchGhRaw(hit);
      if (!body) continue;
      // Look for all ATS pattern occurrences in this file
      for (const found of findAllInBody(body)) {
        if (found.ats === pattern.ats) slugs.add(found.slug.toLowerCase());
      }
    }
    console.log(`  page ${page}: ${items.length} hits, cumulative slugs=${slugs.size}`);
    page++;
    if (items.length < 30 || page > 5) break; // GH search caps at ~1000 results, 30/page
  }
  return slugs;
}

/** Scan a body for ALL ATS matches (not just first like detectAts()). */
function findAllInBody(body: string): AtsDetection[] {
  const out: AtsDetection[] = [];
  const patterns: Array<[string, RegExp]> = [
    ["Greenhouse", /(?:boards|job-boards)\.greenhouse\.io\/([a-z0-9-]+)/gi],
    ["Lever", /jobs\.lever\.co\/([a-z0-9-]+)/gi],
    ["Ashby", /jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/g],
    ["Workable", /apply\.workable\.com\/([a-z0-9-]+)/gi],
    ["Breezy", /\b([a-z0-9][a-z0-9-]+)\.breezy\.hr/gi],
    ["Recruitee", /\b([a-z0-9][a-z0-9-]+)\.recruitee\.com/gi],
    ["Freshteam", /\b([a-z0-9][a-z0-9-]+)\.freshteam\.com/gi],
    ["BambooHR", /\b([a-z0-9][a-z0-9-]+)\.bamboohr\.com/gi],
    ["Personio", /\b([a-z0-9][a-z0-9-]+)\.jobs\.personio\.(?:com|de)/gi],
    ["Teamtailor", /\b([a-z0-9][a-z0-9-]+)\.teamtailor\.com/gi],
  ];
  for (const [ats, rx] of patterns) {
    for (const m of body.matchAll(rx)) {
      const slug = m[1].toLowerCase();
      if (slug.length >= 2 && slug.length <= 50) out.push({ ats, slug });
    }
  }
  return out;
}

// ─── 5. ATS API VALIDATION (does the slug return remote jobs?) ───────────

/**
 * Per-ATS validation. Each ATS exposes a different endpoint with a different
 * payload format — we have to use the right "job indicator" string per
 * source, NOT a one-size-fits-all `"title"|<position` regex.
 */
async function validateSlug(ats: string, slug: string): Promise<{ ok: boolean; jobs: number; remote: number }> {
  // Quick sanity: drop obviously bogus slugs
  if (!slug || slug.length < 2 || slug.length > 50) return { ok: false, jobs: 0, remote: 0 };
  // Generic subdomain names that aren't real tenants (false positives from regex)
  const GENERIC_BLOCKLIST = new Set([
    "api", "app", "www", "jobs", "careers", "blog", "help", "docs",
    "support", "status", "admin", "demo", "test", "staging", "dev",
    "static", "cdn", "mail", "smtp", "ftp",
  ]);
  if (GENERIC_BLOCKLIST.has(slug.toLowerCase())) return { ok: false, jobs: 0, remote: 0 };

  try {
    let url: string;
    let indicator: RegExp; // counts # of jobs in the payload
    if (ats === "Greenhouse") {
      url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
      indicator = /"title"/g;
    } else if (ats === "Lever") {
      url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
      indicator = /"text"/g; // Lever uses .text not .title
    } else if (ats === "Ashby") {
      url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
      indicator = /"title"/g;
    } else if (ats === "Workable") {
      url = `https://apply.workable.com/api/v1/widget/accounts/${slug}`;
      indicator = /"title"/g;
    } else if (ats === "Breezy") {
      url = `https://${slug}.breezy.hr/json`;
      indicator = /"name"|"title"/g;
    } else if (ats === "Recruitee") {
      url = `https://${slug}.recruitee.com/api/offers`;
      indicator = /"title"/g;
    } else if (ats === "SmartRecruiters") {
      url = `https://api.smartrecruiters.com/v1/companies/${slug}/postings`;
      indicator = /"name"/g;
    } else if (ats === "Freshteam") {
      url = `https://${slug}.freshteam.com/jobs`;
      // Freshteam returns HTML; presence of <div class="job-title"> = real tenant with jobs.
      // Absence + "Invalid account URL" = bogus subdomain.
      indicator = /class="[^"]*job-title[^"]*"/g;
    } else if (ats === "BambooHR") {
      url = `https://${slug}.bamboohr.com/careers/list`;
      // BambooHR JSON: {"meta":{"totalCount":N},"result":[{"jobOpeningName":...}]}
      indicator = /"jobOpeningName"/g;
    } else if (ats === "Personio") {
      url = `https://${slug}.jobs.personio.com/xml`;
      indicator = /<position\b/g;
    } else if (ats === "Teamtailor") {
      url = `https://career.${slug}.com/jobs`;
      // We don't have an API key — most tenants 401. We just check for non-error HTML.
      indicator = /class="[^"]*(?:job|position)[^"]*"/gi;
    } else {
      return { ok: false, jobs: 0, remote: 0 };
    }

    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json,application/xml,text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, jobs: 0, remote: 0 };
    const text = await res.text();

    // Negative signal: bogus Freshteam tenant returns an "Invalid account URL"
    // 404 wrapped in 200 HTML. Drop these.
    if (ats === "Freshteam" && /Invalid account URL/i.test(text)) {
      return { ok: false, jobs: 0, remote: 0 };
    }

    const total = (text.match(indicator) ?? []).length;
    // Cheap proxy for "remote-friendly": presence of "remote|anywhere|wfh" in payload
    const remoteHits = (text.match(/\b(remote|anywhere|wfh|work from home)\b/gi) ?? []).length;
    return { ok: total > 0, jobs: total, remote: remoteHits };
  } catch {
    return { ok: false, jobs: 0, remote: 0 };
  }
}

// ─── 6. PROBE A CAREER URL FOR EMBEDDED ATS ───────────────────────────────

async function probe(url: string): Promise<AtsDetection | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const body = await res.text();
    return detectAts(body);
  } catch {
    return null;
  }
}

// ─── 7. MAIN ────────────────────────────────────────────────────────────

async function main() {
  const existing = loadExistingSlugs();
  console.log("Existing hardcoded slugs per ATS:");
  for (const [ats, slugs] of Object.entries(existing)) {
    console.log(`  ${ats.padEnd(18)} ${slugs.size}`);
  }

  const discovered: Record<string, Set<string>> = {};
  for (const ats of Object.keys(existing)) discovered[ats] = new Set();

  // ─── PHASE D ────────────────────────────────────────────────────────
  console.log("\n=== PHASE D — remoteintech/remote-jobs (awesome-list) ===\n");
  const companies = loadCompaniesFromAwesomeList();
  console.log(`Loaded ${companies.length} remote-friendly companies from awesome-list.\n`);

  const BATCH = 10;
  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies.slice(i, i + BATCH);
    const out = await Promise.all(batch.map(async (c) => ({ company: c, det: await probe(c.careers_url) })));
    for (const r of out) {
      if (r.det && discovered[r.det.ats] && !existing[r.det.ats]?.has(r.det.slug.toLowerCase())) {
        discovered[r.det.ats].add(r.det.slug.toLowerCase());
      }
    }
    if ((i + BATCH) % 100 === 0 || i + BATCH >= companies.length) {
      const totalDisc = Object.values(discovered).reduce((s, v) => s + v.size, 0);
      console.log(`  probed ${Math.min(i + BATCH, companies.length)}/${companies.length}  new-slugs=${totalDisc}`);
    }
  }

  // ─── PHASE B ────────────────────────────────────────────────────────
  console.log("\n=== PHASE B — GitHub Code Search ===");
  for (const pattern of GH_QUERIES) {
    const slugs = await searchGithubForAts(pattern, 100);
    for (const s of slugs) {
      if (!existing[pattern.ats]?.has(s)) discovered[pattern.ats].add(s);
    }
  }

  // ─── OUTPUT ────────────────────────────────────────────────────────
  console.log("\n=== DISCOVERED (pre-validation) ===");
  const CAND_DIR = "/tmp/discovered-ats-candidates";
  if (!existsSync(CAND_DIR)) mkdirSync(CAND_DIR, { recursive: true });
  for (const [ats, slugs] of Object.entries(discovered)) {
    console.log(`  ${ats.padEnd(18)} ${slugs.size} new`);
    // Persist pre-validation candidates so we can re-validate without re-fetching 878 pages.
    writeFileSync(`${CAND_DIR}/${ats.toLowerCase()}.txt`, [...slugs].sort().join("\n") + "\n");
  }

  // Validate: hit each ATS API and keep only slugs returning jobs
  console.log("\n=== VALIDATING via ATS APIs ===");
  const validated: Record<string, Array<{ slug: string; jobs: number; remote: number }>> = {};
  for (const [ats, slugs] of Object.entries(discovered)) {
    validated[ats] = [];
    if (slugs.size === 0) continue;
    console.log(`  validating ${slugs.size} ${ats} slugs...`);
    let i = 0;
    for (const slug of slugs) {
      i++;
      const r = await validateSlug(ats, slug);
      if (r.ok && r.jobs > 0) validated[ats].push({ slug, jobs: r.jobs, remote: r.remote });
      if (i % 25 === 0) console.log(`    ${i}/${slugs.size}  validated=${validated[ats].length}`);
    }
  }

  // Write per-ATS files
  const OUT_DIR = "/tmp/discovered-ats";
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  console.log("\n=== OUTPUT ===");
  for (const [ats, list] of Object.entries(validated)) {
    if (list.length === 0) continue;
    list.sort((a, b) => b.jobs - a.jobs);
    const path = `${OUT_DIR}/${ats.toLowerCase()}.txt`;
    const tsv =
      "slug\tjobs\tremote_signal\n" + list.map((r) => `${r.slug}\t${r.jobs}\t${r.remote}`).join("\n");
    writeFileSync(path, tsv);
    console.log(`  ${path}`);
    console.log(`    ${ats}: ${list.length} validated slugs (top 5 by job count):`);
    for (const r of list.slice(0, 5)) {
      console.log(`      ${r.slug.padEnd(30)} jobs=${r.jobs} remote_signal=${r.remote}`);
    }
  }

  const grandTotal = Object.values(validated).reduce((s, v) => s + v.length, 0);
  console.log(`\n✓ ${grandTotal} new validated slugs total. Review & merge into lib/job-sources/*.ts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
