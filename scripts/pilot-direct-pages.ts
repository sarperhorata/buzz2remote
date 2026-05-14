/**
 * Pilot: probe 30 direct company career pages with a realistic browser UA
 * and see what we get back. We are NOT yet running LLM extraction — just
 * inventorying response codes, content sizes, and whether each page ships
 * structured data (JSON-LD JobPosting / microdata) we can parse for free.
 *
 * Output: a TSV table to /tmp/pilot-direct-pages.tsv with
 *   url, http_code, bytes, has_json_ld_jobposting, has_microdata, time_ms.
 *
 * Decision points after the pilot:
 *   - high success rate (>= 80% HTTP 200 + meaningful content) → build a
 *     generic fetcher that pulls JSON-LD first and falls back to regex
 *     patterns for the rest.
 *   - many blocks (403/429/CDN walls) → narrow the catalogue, drop
 *     hostile sites.
 *   - low structured-data hit rate → consider LLM extraction LATER, only
 *     after the user explicitly opts in to spend Groq quota.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const DISTILL = JSON.parse(readFileSync("data/distill/companies.json", "utf-8")) as {
  data: Array<{ name?: string; uri?: string }>;
};

// ATS hosts we already cover or know aren't direct pages.
const ATS_HOSTS = [
  "lever.co", "greenhouse.io", "breezy.hr", "ashbyhq.com", "workable.com",
  "workable.io", "smartrecruiters.com", "recruitee.com", "freshteam.com",
  "jobvite.com", "icims.com", "myworkdayjobs.com", "workdayjobs.com",
  "taleo.net", "bamboohr.com", "personio.de", "personio.com",
  "teamtailor.com", "pinpointhq.com",
];

function isDirectPage(uri: string): boolean {
  return !ATS_HOSTS.some((h) => uri.includes(h));
}

const ALL_DIRECT = DISTILL.data
  .map((row) => row.uri)
  .filter((u): u is string => typeof u === "string" && isDirectPage(u));

// Pick 30 evenly-spaced URLs across the list — better coverage than first 30.
const N = 30;
const step = Math.max(1, Math.floor(ALL_DIRECT.length / N));
const SAMPLE = ALL_DIRECT.filter((_, i) => i % step === 0).slice(0, N);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface Result {
  url: string;
  code: number | "err";
  bytes: number;
  jsonLd: boolean;
  microdata: boolean;
  ms: number;
  contentSnippet: string;
}

async function probe(url: string): Promise<Result> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.text();
    const jsonLd = /application\/ld\+json[\s\S]*?"@type"\s*:\s*"JobPosting"/i.test(body);
    const microdata = /itemtype="https?:\/\/schema\.org\/JobPosting"/i.test(body);
    // First-ish job-y signal: count of "h2/h3 with class containing job/title/role"
    const headingMatches = body.match(/<h[2-4][^>]*>[^<]{8,80}<\/h[2-4]>/gi) ?? [];
    const snippet = headingMatches.slice(0, 3).join(" | ").replace(/<[^>]+>/g, "").slice(0, 180);
    return {
      url,
      code: res.status,
      bytes: body.length,
      jsonLd,
      microdata,
      ms: Date.now() - t0,
      contentSnippet: snippet,
    };
  } catch (err) {
    return {
      url,
      code: "err",
      bytes: 0,
      jsonLd: false,
      microdata: false,
      ms: Date.now() - t0,
      contentSnippet: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log(`Probing ${SAMPLE.length} of ${ALL_DIRECT.length} direct URLs...\n`);
  // Sequential to avoid overwhelming any one host; 30 URLs at ~3s each = 90s.
  const results: Result[] = [];
  for (const u of SAMPLE) {
    const r = await probe(u);
    results.push(r);
    const flag = r.code === 200 && r.bytes > 1000 ? "✓" : r.code === "err" ? "✗" : "·";
    const ld = r.jsonLd ? "JSON-LD" : r.microdata ? "microdata" : "-";
    console.log(
      `${flag} ${String(r.code).padEnd(4)} ${String(r.bytes).padStart(6)}B ${String(r.ms).padStart(5)}ms ${ld.padEnd(9)} ${r.url}`
    );
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  const ok = results.filter((r) => r.code === 200 && r.bytes > 1000);
  const blocked = results.filter((r) => typeof r.code === "number" && (r.code === 403 || r.code === 429 || r.code === 401));
  const err = results.filter((r) => r.code === "err");
  const ld = results.filter((r) => r.jsonLd || r.microdata);
  console.log(`OK (200, >1KB):       ${ok.length}/${results.length}`);
  console.log(`Blocked (4xx auth):   ${blocked.length}/${results.length}`);
  console.log(`Network errors:       ${err.length}/${results.length}`);
  console.log(`Structured data:      ${ld.length}/${results.length}`);

  // Sample successful pages with JSON-LD — these we can extract for free
  if (ld.length > 0) {
    console.log("\nFree-extraction candidates (JSON-LD / microdata):");
    for (const r of ld) console.log(`  ${r.url}`);
  }

  // Write TSV for further inspection
  const tsv =
    "url\tcode\tbytes\tjsonLd\tmicrodata\tms\tsnippet\n" +
    results
      .map(
        (r) =>
          `${r.url}\t${r.code}\t${r.bytes}\t${r.jsonLd}\t${r.microdata}\t${r.ms}\t${r.contentSnippet.replace(/\t/g, " ")}`
      )
      .join("\n");
  const out = "/tmp/pilot-direct-pages.tsv";
  await import("node:fs").then((fs) => fs.writeFileSync(out, tsv));
  console.log(`\nFull TSV: ${out}`);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
