/**
 * Populate the `companies` table from the curated Distill catalogue.
 *
 * data/distill/companies.json contains 434+ remote-friendly company career
 * pages (mix of ATS-hosted and direct custom pages). Until now we've used
 * the URLs only as fetcher input — but `/companies` and `/companies/[id]`
 * pages exist and the table was empty. This seeder fills it so the
 * Companies directory becomes useful.
 *
 * Strategy:
 *   - One row per distill entry (deduped by company name, case-insensitive).
 *   - name: derived from entry.name (strip "Careers", "Jobs", separators);
 *           if junk, fall back to the URL's apex domain titlecased.
 *   - website: apex domain (stripped of subdomain) https://example.com
 *   - career_page: original distill URI
 *   - logo_url: https://logo.clearbit.com/<apex> (Clearbit covers ~80% of
 *               well-known companies; missing logos are fine, the UI has a
 *               fallback initial avatar).
 *   - is_active: true
 *
 * Idempotent: re-running upserts. Existing rows with the same name keep
 * their description/industry/etc — only career_page, logo_url, and
 * is_active are refreshed.
 *
 * Run: npx tsx scripts/seed-companies-from-distill.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db";

// Hosts that act as career-page-of-record for ANOTHER company. We can't
// derive a meaningful name from these — drop them and rely on the
// "name" field from distill if present, else skip.
const ATS_HOSTS = [
  "lever.co", "greenhouse.io", "breezy.hr", "ashbyhq.com", "workable.com",
  "smartrecruiters.com", "recruitee.com", "freshteam.com", "bamboohr.com",
  "personio.de", "personio.com", "teamtailor.com", "pinpointhq.com",
  "myworkdayjobs.com", "workdayjobs.com", "taleo.net", "icims.com",
  "jobvite.com", "applytojob.com", "homerun.co", "hrpanda.co",
  "applicantpro.com", "notion.site", "ycombinator.com", "join.com",
];

/**
 * Strip common boilerplate from a career-page title to recover the
 * underlying brand. "Careers | 10up" → "10up", "Jobs at Stripe" → "Stripe".
 */
function cleanName(raw: string | undefined): string {
  if (!raw) return "";
  let n = raw;
  // Strip leading / trailing decorations + brand boilerplate.
  n = n
    .replace(/^(Careers?|Jobs?|Hiring|Open Positions?|Work with us|Open Roles?|Join us|We're Hiring|Apply)\s*[|·—:\-]\s*/i, "")
    .replace(/\s*[|·—:\-]\s*(Careers?|Jobs?|Hiring|Apply|Open Positions?)\s*$/i, "")
    .replace(/^(Careers? at|Jobs? at|Work at|Working at)\s+/i, "")
    .replace(/^Apply for a job at\s+/i, "")
    .replace(/^[|·—:\-]+\s*/, "")
    .replace(/\s*[|·—:\-]+$/, "")
    .trim();
  // Strip emoji / leading control chars
  n = n.replace(/^\W+/, "").trim();
  return n;
}

/**
 * For URLs hosted on an ATS (jobs.lever.co/foo, foo.greenhouse.io,
 * foo.breezy.hr) the meaningful slug is somewhere in the URL itself.
 * Extract it so we can use it as a fallback name.
 */
function slugFromATSUrl(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "");
  // path-based: jobs.lever.co/SLUG, jobs.ashbyhq.com/SLUG, careers.smartrecruiters.com/SLUG
  if (host === "jobs.lever.co" || host === "api.lever.co" ||
      host === "jobs.ashbyhq.com" ||
      host === "careers.smartrecruiters.com" || host === "jobs.smartrecruiters.com" ||
      host === "boards.greenhouse.io" || host === "boards-api.greenhouse.io") {
    return u.pathname.split("/").filter(Boolean)[0] ?? null;
  }
  // subdomain-based: SLUG.{breezy,recruitee,freshteam,workable,pinpointhq,bamboohr}
  for (const ats of ["breezy.hr", "recruitee.com", "freshteam.com", "workable.com",
                     "pinpointhq.com", "bamboohr.com", "teamtailor.com",
                     "personio.com", "personio.de", "homerun.co"]) {
    if (host.endsWith(ats)) {
      const sub = host.slice(0, -ats.length - 1);
      if (sub && sub !== "www" && sub !== "jobs" && sub !== "apply") return sub;
    }
  }
  return null;
}

/**
 * Pick the apex domain (no subdomain) for website + Clearbit logo.
 * For ATS URLs we can't derive an apex (the apex IS the ATS, e.g.
 * lever.co), so we return null — those companies will have a
 * career_page but no website/logo.
 */
function apexDomain(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "");
  if (ATS_HOSTS.some((a) => host.endsWith(a))) return null;
  // Two-part: "example.com" → "example.com"
  // Three+ part: "careers.example.com" → "example.com" (strip first label)
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  // Common case: subdomain like "careers." or "jobs." or "join."
  return parts.slice(-2).join(".");
}

interface DistillEntry { name?: string; uri?: string; }

async function main() {
  const path = "data/distill/companies.json";
  const raw = JSON.parse(readFileSync(path, "utf-8")) as { data: DistillEntry[] };
  console.log(`Read ${raw.data.length} distill entries from ${path}`);

  // Build candidate company records, deduplicated by lowercased-name.
  const candidates = new Map<string, {
    name: string;
    website: string | null;
    career_page: string;
    logo_url: string | null;
  }>();

  let skipped = 0;
  for (const entry of raw.data) {
    if (!entry.uri) { skipped++; continue; }
    let u: URL;
    try { u = new URL(entry.uri); } catch { skipped++; continue; }

    // Derive a name: cleaned distill title first; if junk, ATS slug; else domain.
    let name = cleanName(entry.name);
    if (!name || name.length < 2 || /^https?:/i.test(name)) {
      const slug = slugFromATSUrl(u);
      if (slug) name = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    }
    if (!name) {
      const apex = apexDomain(u);
      if (apex) {
        // "example.com" → "Example"
        name = apex.split(".")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    if (!name) { skipped++; continue; }

    // Normalise (cap at 255, the DB column limit).
    name = name.slice(0, 255).trim();
    const key = name.toLowerCase();
    // First write wins (some distill entries are duplicates with different URLs).
    if (candidates.has(key)) continue;

    const apex = apexDomain(u);
    candidates.set(key, {
      name,
      website: apex ? `https://${apex}` : null,
      career_page: entry.uri.slice(0, 1024),
      logo_url: apex ? `https://logo.clearbit.com/${apex}` : null,
    });
  }

  console.log(`Built ${candidates.size} unique company candidates (skipped ${skipped})`);

  // Upsert each. We rely on the unique index on `name` for dedup; if the
  // row already exists, refresh URL+logo but don't touch optional fields
  // that may have been manually filled.
  let created = 0;
  let updated = 0;
  for (const c of candidates.values()) {
    const existing = await prisma.companies.findUnique({
      where: { name: c.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.companies.update({
        where: { id: existing.id },
        data: {
          website: c.website ?? undefined,
          career_page: c.career_page,
          logo_url: c.logo_url ?? undefined,
          is_active: true,
          updated_at: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.companies.create({
        data: {
          id: randomUUID(),
          name: c.name,
          website: c.website,
          career_page: c.career_page,
          logo_url: c.logo_url,
          is_active: true,
        },
      });
      created++;
    }
  }

  console.log(`\nDone. Created ${created}, updated ${updated}.`);
  const total = await prisma.companies.count({ where: { is_active: true } });
  console.log(`Active companies in table: ${total}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
