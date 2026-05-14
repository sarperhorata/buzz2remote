import { JobSource, RawJob } from "./types";

/**
 * Personio (Germany-based ATS, popular with EU tech companies).
 *
 * Personio exposes a public XML feed per tenant at:
 *   https://{slug}.jobs.personio.com/xml
 *   https://{slug}.jobs.personio.de/xml
 *
 * No API key required, no rate limit documented, but we keep concurrency
 * low and one fetch per tenant per cron run.
 *
 * Companies were derived from the distill catalogue + embedded-ATS sweep.
 * Personio is small in our dataset (~3 hits) but enabling it is cheap so
 * we add it anyway. If we ever want a wider list, search distill for
 * "personio" hostnames.
 */
// Discovered slugs from data/distill/companies.json. Both verified to
// return HTTP 200 XML feeds at /xml on 2026-05-14.
const PERSONIO_COMPANIES: Array<{ slug: string; locale: "com" | "de" }> = [
  { slug: "cycloid",    locale: "de"  },
  { slug: "littledata", locale: "com" },
];

async function fetchPersonioJobs(slug: string, locale: "com" | "de"): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${slug}.jobs.personio.${locale}/xml`,
      { headers: { "User-Agent": "Buzz2Remote/1.0", Accept: "application/xml" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const xml = await res.text();

    // Personio's XML is straightforward: <workzag-jobs><position>...</position></workzag-jobs>
    // Each <position> has <id>, <name>, <subcompany>, <office>, <department>,
    // <recruitingCategory>, <employmentType>, <seniority>, <schedule>, <yearsOfExperience>,
    // <createdAt>, <jobDescriptions> (HTML).
    //
    // We extract via regex rather than a full XML parser to keep the
    // dependency tree minimal — feed contents are well-formed XML in practice.
    const jobs: RawJob[] = [];
    const positionRegex = /<position>([\s\S]*?)<\/position>/g;
    let m: RegExpExecArray | null;
    while ((m = positionRegex.exec(xml)) !== null) {
      const block = m[1];
      const tag = (name: string) => {
        const r = new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, "i");
        const x = block.match(r);
        return x?.[1]?.trim() ?? "";
      };
      const id = tag("id");
      const title = tag("name");
      if (!title) continue;
      const office = tag("office");
      const employmentType = tag("employmentType");
      const created = tag("createdAt");
      const description = tag("jobDescriptions");

      jobs.push({
        title,
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        location: office || "Remote",
        description,
        url: `https://${slug}.jobs.personio.${locale}/job/${id}`,
        salary: null,
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        job_type: employmentType || "Full-time",
        remote_type: /remote/i.test(office) ? "Remote" : null,
        experience_level: tag("seniority") || null,
        skills: [],
        tags: [tag("department"), tag("recruitingCategory")].filter(Boolean),
        posted_date: created || null,
        source: "Personio",
        source_url: `https://${slug}.jobs.personio.${locale}/`,
        external_id: `personio-${slug}-${id}`,
      });
    }

    return jobs.filter((j) => j.title && j.company);
  } catch {
    return [];
  }
}

export const personio: JobSource = {
  name: "Personio",
  async fetch(): Promise<RawJob[]> {
    if (PERSONIO_COMPANIES.length === 0) return [];
    const all: RawJob[] = [];
    // Small batch parallel — Personio doesn't publish rate limits.
    for (let i = 0; i < PERSONIO_COMPANIES.length; i += 4) {
      const batch = PERSONIO_COMPANIES.slice(i, i + 4);
      const results = await Promise.allSettled(batch.map((c) => fetchPersonioJobs(c.slug, c.locale)));
      for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
    }
    return all;
  },
};
