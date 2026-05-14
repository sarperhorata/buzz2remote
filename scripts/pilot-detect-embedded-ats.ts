/**
 * For each of the 297 "direct" career pages, fetch the HTML once and
 * check whether it actually EMBEDS a known ATS (Greenhouse iframe,
 * Lever script, Ashby widget, etc.). If so, we can route those pages
 * through our existing fetchers for free — no parsing needed.
 *
 * Cost: ~10 min sequential, 0 LLM calls, ~150 MB of HTML fetched and
 * discarded.
 *
 * Output: /tmp/embedded-ats.tsv with url, detected_ats, slug_guess
 */
import { readFileSync, writeFileSync } from "node:fs";

const DISTILL = JSON.parse(readFileSync("data/distill/companies.json", "utf-8")) as {
  data: Array<{ name?: string; uri?: string }>;
};

const ATS_HOSTS = [
  "lever.co", "greenhouse.io", "breezy.hr", "ashbyhq.com", "workable.com",
  "workable.io", "smartrecruiters.com", "recruitee.com", "freshteam.com",
  "jobvite.com", "icims.com", "myworkdayjobs.com", "workdayjobs.com",
  "taleo.net", "bamboohr.com", "personio.de", "personio.com",
  "teamtailor.com", "pinpointhq.com",
];

const isDirectPage = (uri: string) => !ATS_HOSTS.some((h) => uri.includes(h));

const DIRECT = DISTILL.data
  .map((d) => d.uri)
  .filter((u): u is string => typeof u === "string" && isDirectPage(u));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Detector → returns { ats, slug } or null.
// Each pattern is keyed to a well-known ATS embed signature so the page's
// own domain doesn't matter — we just look for the iframe/script that
// betrays the ATS in use, plus capture the slug to route the page through
// our existing fetcher.
function detectAts(body: string): { ats: string; slug: string } | null {
  // Greenhouse: <iframe src="https://boards.greenhouse.io/embed/job_board?for=COMPANY">
  // or <script src=".../greenhouse.io/embed">
  // or referenced in inline data as boards-api.greenhouse.io/v1/boards/SLUG/jobs
  const g1 = body.match(/greenhouse\.io\/embed\/job_board\?for=([a-z0-9-]+)/i);
  if (g1) return { ats: "Greenhouse", slug: g1[1] };
  const g2 = body.match(/boards-api\.greenhouse\.io\/v1\/boards\/([a-z0-9-]+)\//i);
  if (g2) return { ats: "Greenhouse", slug: g2[1] };
  const g3 = body.match(/job-boards\.greenhouse\.io\/([a-z0-9-]+)/i);
  if (g3) return { ats: "Greenhouse", slug: g3[1] };

  // Lever: jobs.lever.co/COMPANY embeds + lever-jobs widget
  const l1 = body.match(/jobs\.lever\.co\/([a-z0-9-]+)/i);
  if (l1) return { ats: "Lever", slug: l1[1] };
  const l2 = body.match(/api\.lever\.co\/v0\/postings\/([a-z0-9-]+)/i);
  if (l2) return { ats: "Lever", slug: l2[1] };

  // Ashby: jobs.ashbyhq.com/COMPANY  or api.ashbyhq.com  with company in URL/script
  const a1 = body.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/);
  if (a1) return { ats: "Ashby", slug: a1[1] };

  // Workable: apply.workable.com/COMPANY or workable.com/api/accounts/COMPANY
  const w1 = body.match(/apply\.workable\.com\/([a-z0-9-]+)/i);
  if (w1) return { ats: "Workable", slug: w1[1] };
  const w2 = body.match(/workable\.com\/api\/accounts\/([a-z0-9-]+)/i);
  if (w2) return { ats: "Workable", slug: w2[1] };

  // Breezy: COMPANY.breezy.hr
  const b1 = body.match(/([a-z0-9][a-z0-9-]+)\.breezy\.hr/i);
  if (b1) return { ats: "Breezy", slug: b1[1] };

  // Recruitee: COMPANY.recruitee.com
  const r1 = body.match(/([a-z0-9][a-z0-9-]+)\.recruitee\.com/i);
  if (r1) return { ats: "Recruitee", slug: r1[1] };

  // SmartRecruiters: api.smartrecruiters.com/v1/companies/COMPANY
  const s1 = body.match(/smartrecruiters\.com\/(?:v1\/companies\/)?([A-Za-z0-9-]+)/);
  if (s1) return { ats: "SmartRecruiters", slug: s1[1] };

  // Freshteam: COMPANY.freshteam.com
  const f1 = body.match(/([a-z0-9][a-z0-9-]+)\.freshteam\.com/i);
  if (f1) return { ats: "Freshteam", slug: f1[1] };

  // BambooHR: COMPANY.bamboohr.com/careers
  const bb1 = body.match(/([a-z0-9][a-z0-9-]+)\.bamboohr\.com/i);
  if (bb1) return { ats: "BambooHR", slug: bb1[1] };

  // Personio: COMPANY.jobs.personio.com or COMPANY.jobs.personio.de
  const p1 = body.match(/([a-z0-9][a-z0-9-]+)\.jobs\.personio\.(?:com|de)/i);
  if (p1) return { ats: "Personio", slug: p1[1] };

  // Teamtailor: COMPANY.teamtailor.com or COMPANY.recruitee
  const t1 = body.match(/([a-z0-9][a-z0-9-]+)\.teamtailor\.com/i);
  if (t1) return { ats: "Teamtailor", slug: t1[1] };

  return null;
}

interface Row {
  url: string;
  code: number | "err";
  ats: string;
  slug: string;
  err?: string;
}

async function probe(url: string): Promise<Row> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { url, code: res.status, ats: "", slug: "" };
    const body = await res.text();
    const det = detectAts(body);
    return { url, code: 200, ats: det?.ats ?? "", slug: det?.slug ?? "" };
  } catch (err) {
    return { url, code: "err", ats: "", slug: "", err: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  console.log(`Probing ${DIRECT.length} direct pages for embedded ATS...\n`);
  const results: Row[] = [];

  // Parallel batches of 8 so we don't overwhelm any one CDN or trip ourselves.
  const BATCH = 8;
  for (let i = 0; i < DIRECT.length; i += BATCH) {
    const batch = DIRECT.slice(i, i + BATCH);
    const out = await Promise.all(batch.map(probe));
    results.push(...out);
    for (const r of out) {
      const flag = r.ats ? `→ ${r.ats}/${r.slug}` : r.code === 200 ? "(no ATS detected)" : `(${r.code})`;
      console.log(`  ${flag.padEnd(35)} ${r.url}`);
    }
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Total probed:        ${results.length}`);
  console.log(`HTTP 200:            ${results.filter((r) => r.code === 200).length}`);
  console.log(`Detected ATS:        ${results.filter((r) => r.ats).length}`);
  console.log(`No ATS detected:     ${results.filter((r) => r.code === 200 && !r.ats).length}`);
  console.log(`Errors/blocked:      ${results.filter((r) => r.code !== 200).length}`);

  // Per-ATS breakdown
  const byAts: Record<string, number> = {};
  for (const r of results) if (r.ats) byAts[r.ats] = (byAts[r.ats] ?? 0) + 1;
  console.log("\nEmbedded ATS distribution:");
  for (const [a, n] of Object.entries(byAts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${a.padEnd(20)} ${n}`);
  }

  // Output: slug-only file by ATS so we can paste into existing fetchers
  const tsv =
    "url\tcode\tats\tslug\n" + results.map((r) => `${r.url}\t${r.code}\t${r.ats}\t${r.slug}`).join("\n");
  writeFileSync("/tmp/embedded-ats.tsv", tsv);
  console.log(`\nFull TSV: /tmp/embedded-ats.tsv`);

  // Also: slug lists per ATS, ready to merge into fetchers
  const slugsByAts: Record<string, Set<string>> = {};
  for (const r of results) {
    if (!r.ats || !r.slug) continue;
    (slugsByAts[r.ats] ??= new Set()).add(r.slug.toLowerCase());
  }
  for (const [ats, slugs] of Object.entries(slugsByAts)) {
    const path = `/tmp/embedded-${ats.toLowerCase()}.txt`;
    writeFileSync(path, [...slugs].sort().join("\n") + "\n");
    console.log(`  → ${path} (${slugs.size} slugs)`);
  }
}

main().catch((e) => { console.error("FAIL", e); process.exit(1); });
