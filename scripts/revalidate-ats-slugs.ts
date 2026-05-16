/**
 * Re-validate slugs from /tmp/discovered-ats-candidates/{ats}.txt without
 * re-running the 30-min Phase D+B discovery. Useful when we tweak the
 * per-ATS validation logic (e.g. fixing BambooHR's jobOpeningName check).
 *
 * Reads candidates from disk, hits each ATS API with the same logic as
 * discover-ats-slugs.ts, writes /tmp/discovered-ats/{ats}.txt fresh.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0";

const GENERIC_BLOCKLIST = new Set([
  "api", "app", "www", "jobs", "careers", "blog", "help", "docs",
  "support", "status", "admin", "demo", "test", "staging", "dev",
  "static", "cdn", "mail", "smtp", "ftp",
]);

async function validateSlug(
  ats: string,
  slug: string
): Promise<{ ok: boolean; jobs: number; remote: number }> {
  if (!slug || slug.length < 2 || slug.length > 50) return { ok: false, jobs: 0, remote: 0 };
  if (GENERIC_BLOCKLIST.has(slug.toLowerCase())) return { ok: false, jobs: 0, remote: 0 };

  try {
    let url: string;
    let indicator: RegExp;
    if (ats === "Greenhouse") {
      url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
      indicator = /"title"/g;
    } else if (ats === "Lever") {
      url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
      indicator = /"text"/g;
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
      indicator = /class="[^"]*job-title[^"]*"/g;
    } else if (ats === "BambooHR") {
      url = `https://${slug}.bamboohr.com/careers/list`;
      indicator = /"jobOpeningName"/g;
    } else if (ats === "Personio") {
      url = `https://${slug}.jobs.personio.com/xml`;
      indicator = /<position\b/g;
    } else {
      return { ok: false, jobs: 0, remote: 0 };
    }

    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json,application/xml,text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, jobs: 0, remote: 0 };
    const text = await res.text();
    if (ats === "Freshteam" && /Invalid account URL/i.test(text)) {
      return { ok: false, jobs: 0, remote: 0 };
    }
    const total = (text.match(indicator) ?? []).length;
    const remoteHits = (text.match(/\b(remote|anywhere|wfh|work from home)\b/gi) ?? []).length;
    return { ok: total > 0, jobs: total, remote: remoteHits };
  } catch {
    return { ok: false, jobs: 0, remote: 0 };
  }
}

async function main() {
  const CAND_DIR = "/tmp/discovered-ats-candidates";
  const OUT_DIR = "/tmp/discovered-ats";
  if (!existsSync(CAND_DIR)) {
    console.error(`${CAND_DIR} not found. Run discover-ats-slugs.ts first to seed candidates.`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(CAND_DIR).filter((f) => f.endsWith(".txt"));
  console.log(`Re-validating ${files.length} ATS candidate files from ${CAND_DIR}\n`);

  let grandTotal = 0;
  for (const f of files) {
    const atsKey = f.replace(/\.txt$/, "");
    // Reverse-map: "ashby.txt" → "Ashby", "smartrecruiters.txt" → "SmartRecruiters" etc.
    const labelMap: Record<string, string> = {
      greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", workable: "Workable",
      breezy: "Breezy", recruitee: "Recruitee", smartrecruiters: "SmartRecruiters",
      freshteam: "Freshteam", bamboohr: "BambooHR", personio: "Personio",
      teamtailor: "Teamtailor", pinpointhq: "PinpointHQ",
    };
    const ats = labelMap[atsKey] ?? atsKey;
    const slugs = readFileSync(`${CAND_DIR}/${f}`, "utf-8")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (slugs.length === 0) continue;

    console.log(`  ${ats.padEnd(18)} candidates=${slugs.length}, validating...`);
    const validated: Array<{ slug: string; jobs: number; remote: number }> = [];
    let i = 0;
    // Modest concurrency to be polite + avoid getting our IP rate-limited.
    const CONCURRENCY = 6;
    for (let k = 0; k < slugs.length; k += CONCURRENCY) {
      const batch = slugs.slice(k, k + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (slug) => ({ slug, r: await validateSlug(ats, slug) }))
      );
      for (const { slug, r } of results) {
        i++;
        if (r.ok && r.jobs > 0) validated.push({ slug, jobs: r.jobs, remote: r.remote });
      }
      if (k > 0 && k % 30 === 0) {
        console.log(`    ${i}/${slugs.length}  validated=${validated.length}`);
      }
    }

    validated.sort((a, b) => b.jobs - a.jobs);
    const path = `${OUT_DIR}/${atsKey}.txt`;
    const tsv =
      "slug\tjobs\tremote_signal\n" +
      validated.map((r) => `${r.slug}\t${r.jobs}\t${r.remote}`).join("\n");
    writeFileSync(path, tsv);
    console.log(`    → ${path}  (${validated.length} validated)`);
    if (validated.length > 0) {
      console.log(`    top 3: ${validated.slice(0, 3).map((r) => `${r.slug}=${r.jobs}`).join(", ")}`);
    }
    grandTotal += validated.length;
  }
  console.log(`\n✓ ${grandTotal} total validated slugs (Greenhouse + Lever + Ashby + Workable + Breezy + Recruitee + Freshteam + BambooHR + Personio + SmartRecruiters + Teamtailor)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
