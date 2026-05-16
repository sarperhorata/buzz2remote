/**
 * Auto-merge: take validated slugs from /tmp/discovered-ats/{ats}.txt and
 * append them into the corresponding lib/job-sources/{file}.ts array literal.
 *
 * Each ATS source file declares a `const {ATS}_COMPANIES` array near the top.
 * We replace its contents with the union of (existing ∪ discovered), sorted,
 * unique, one quoted slug per line in chunks of 5 for readability.
 *
 * Personio is special: it stores `{slug, locale}` objects. Newly discovered
 * slugs default to locale "com" (most common); user can flip to "de" later.
 *
 * Run: npx tsx scripts/merge-discovered-slugs.ts
 *      npx tsx scripts/merge-discovered-slugs.ts --dry-run   # print diff only
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";

const DISCOVERED_DIR = "/tmp/discovered-ats";
const DRY_RUN = process.argv.includes("--dry-run");

interface MergeTarget {
  ats: string;
  file: string;
  arrayName: string;
  format: "string" | "personio"; // personio uses {slug, locale} objects
}

const TARGETS: MergeTarget[] = [
  { ats: "greenhouse", file: "lib/job-sources/greenhouse.ts", arrayName: "GREENHOUSE_COMPANIES", format: "string" },
  { ats: "lever",      file: "lib/job-sources/lever.ts",      arrayName: "LEVER_COMPANIES",      format: "string" },
  { ats: "ashby",      file: "lib/job-sources/ashby.ts",      arrayName: "ASHBY_COMPANIES",      format: "string" },
  { ats: "workable",   file: "lib/job-sources/workable.ts",   arrayName: "WORKABLE_COMPANIES",   format: "string" },
  { ats: "breezy",     file: "lib/job-sources/breezy.ts",     arrayName: "BREEZY_COMPANIES",     format: "string" },
  { ats: "freshteam",  file: "lib/job-sources/freshteam.ts",  arrayName: "FRESHTEAM_COMPANIES",  format: "string" },
  { ats: "recruitee",  file: "lib/job-sources/recruitee-source.ts", arrayName: "RECRUITEE_COMPANIES", format: "string" },
  { ats: "bamboohr",   file: "lib/job-sources/bamboohr.ts",   arrayName: "BAMBOOHR_COMPANIES",   format: "string" },
  { ats: "personio",   file: "lib/job-sources/personio.ts",   arrayName: "PERSONIO_COMPANIES",   format: "personio" },
];

function loadDiscovered(atsKey: string): string[] {
  const path = `${DISCOVERED_DIR}/${atsKey}.txt`;
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf-8").split("\n").slice(1); // skip header
  return lines.map((l) => l.split("\t")[0]).filter((s) => s && s.length > 0);
}

/** Extract slugs from an existing array literal. */
function parseExisting(fileContent: string, arrayName: string, format: "string" | "personio"): Set<string> {
  const re = new RegExp(`const\\s+${arrayName}[^=]*=\\s*\\[([\\s\\S]*?)\\]`);
  const m = fileContent.match(re);
  if (!m) return new Set();
  const body = m[1];
  const out = new Set<string>();
  if (format === "string") {
    for (const mm of body.matchAll(/"([a-zA-Z0-9-_.]+)"/g)) {
      out.add(mm[1].toLowerCase());
    }
  } else {
    // personio: {slug: "x", locale: "y"}
    for (const mm of body.matchAll(/slug:\s*"([a-zA-Z0-9-_.]+)"/g)) {
      out.add(mm[1].toLowerCase());
    }
  }
  return out;
}

/** Format a new array body: chunks of 5 per line, alphabetical. */
function formatStringArray(slugs: string[]): string {
  const sorted = [...new Set(slugs.map((s) => s.toLowerCase()))].sort();
  const lines: string[] = [];
  for (let i = 0; i < sorted.length; i += 5) {
    const chunk = sorted.slice(i, i + 5).map((s) => `"${s}"`).join(",");
    lines.push(`  ${chunk}${i + 5 < sorted.length ? "," : ","}`);
  }
  return lines.join("\n");
}

function formatPersonioArray(existing: Map<string, string>, newSlugs: string[]): string {
  // Existing is Map<slug, locale>. New slugs default to "com".
  const all = new Map(existing);
  for (const s of newSlugs) {
    if (!all.has(s.toLowerCase())) all.set(s.toLowerCase(), "com");
  }
  const sorted = [...all.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([slug, locale]) => `  { slug: "${slug}", locale: "${locale}" },`).join("\n");
}

function parsePersonioExisting(fileContent: string): Map<string, string> {
  const re = /const\s+PERSONIO_COMPANIES[^=]*=\s*\[([\s\S]*?)\]/;
  const m = fileContent.match(re);
  if (!m) return new Map();
  const out = new Map<string, string>();
  for (const mm of m[1].matchAll(/slug:\s*"([^"]+)"\s*,\s*locale:\s*"([^"]+)"/g)) {
    out.set(mm[1].toLowerCase(), mm[2]);
  }
  return out;
}

/** Replace the array literal body in the file content. */
function replaceArrayBody(content: string, arrayName: string, newBody: string): string {
  const re = new RegExp(`(const\\s+${arrayName}[^=]*=\\s*\\[)([\\s\\S]*?)(\\])`);
  return content.replace(re, `$1\n${newBody}\n$3`);
}

async function main() {
  let totalAdded = 0;
  console.log(DRY_RUN ? "🔍 DRY RUN — no files written\n" : "✏️  Merging discovered slugs into lib/job-sources/*.ts\n");

  for (const tgt of TARGETS) {
    if (!existsSync(tgt.file)) {
      console.log(`  ⚠ ${tgt.file} missing, skip`);
      continue;
    }
    const content = readFileSync(tgt.file, "utf-8");
    const discovered = loadDiscovered(tgt.ats);
    if (discovered.length === 0) {
      console.log(`  ${tgt.ats.padEnd(12)} no candidates, skip`);
      continue;
    }

    let updated: string;
    let beforeCount: number;
    let afterCount: number;

    if (tgt.format === "personio") {
      const existing = parsePersonioExisting(content);
      beforeCount = existing.size;
      const newBody = formatPersonioArray(existing, discovered);
      updated = replaceArrayBody(content, tgt.arrayName, newBody);
      afterCount = new Set([...existing.keys(), ...discovered.map((s) => s.toLowerCase())]).size;
    } else {
      const existing = parseExisting(content, tgt.arrayName, "string");
      beforeCount = existing.size;
      const merged = [...existing, ...discovered.map((s) => s.toLowerCase())];
      const newBody = formatStringArray(merged);
      updated = replaceArrayBody(content, tgt.arrayName, newBody);
      afterCount = new Set(merged).size;
    }

    const delta = afterCount - beforeCount;
    totalAdded += delta;
    console.log(
      `  ${tgt.ats.padEnd(12)} ${String(beforeCount).padStart(3)} → ${String(afterCount).padStart(3)}   (+${delta})`
    );

    if (!DRY_RUN && updated !== content) {
      writeFileSync(tgt.file, updated);
    }
  }
  console.log(`\n✓ TOTAL: +${totalAdded} slugs across ${TARGETS.length} ATS files.`);
  if (DRY_RUN) console.log("  Re-run without --dry-run to write changes.");
}

main().catch((e) => { console.error(e); process.exit(1); });
