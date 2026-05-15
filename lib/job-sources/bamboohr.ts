import { JobSource, RawJob } from "./types";

/**
 * BambooHR (small/mid-market HR platform, popular with US tech).
 *
 * Public endpoint per tenant:
 *   https://{slug}.bamboohr.com/careers/list
 *   Accept: application/json
 *
 * No API key needed. Returns:
 *   { meta: { totalCount }, result: [ { id, jobOpeningName, departmentLabel,
 *     employmentStatusLabel, location: { city, state }, atsLocation: {...},
 *     isRemote, locationType, ... } ] }
 *
 * Verified 2026-05-14 against prodigyfinance (3), sestek (10), simetrik
 * (10), fourkitchens (2). bookingsync was 0 (no current openings), uscreen
 * is now 0 too (had openings during the distill snapshot).
 *
 * Limitation: the list endpoint returns only summary fields. There's no
 * description field — we get the title + location + employment type, and
 * we'd need a second fetch to /careers/{id} for the body. For now we
 * leave description blank; users click through to the BambooHR page.
 */
const BAMBOOHR_COMPANIES: Array<string> = [
  "prodigyfinance", "sestek", "simetrik", "fourkitchens",
  "bookingsync", "uscreen",
];

interface BambooHRJob {
  id: string | number;
  jobOpeningName?: string;
  departmentLabel?: string | null;
  employmentStatusLabel?: string | null;
  location?: { city?: string | null; state?: string | null };
  atsLocation?: { country?: string | null; state?: string | null; city?: string | null };
  isRemote?: number | null; // 1 / 0 / null
  locationType?: string | null;
  datePosted?: string | null;
}

async function fetchBambooHRJobs(slug: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://${slug}.bamboohr.com/careers/list`,
      {
        headers: { "User-Agent": "Buzz2Remote/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as { meta?: { totalCount?: number }; result?: BambooHRJob[] };
    const jobs = data.result ?? [];
    const company = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    return jobs
      .map((j) => {
        const title = (j.jobOpeningName ?? "").trim();
        // Compose a human location from whichever fields BambooHR populated.
        const loc =
          [j.location?.city, j.location?.state].filter(Boolean).join(", ") ||
          [j.atsLocation?.city, j.atsLocation?.state, j.atsLocation?.country].filter(Boolean).join(", ") ||
          "Remote";
        const isRemote = j.isRemote === 1 || j.locationType === "2" || /remote/i.test(loc);
        return {
          title,
          company,
          location: loc,
          // No description in the list endpoint — left blank rather than
          // making a per-job fetch (would multiply HTTP calls ~10x).
          description: "",
          url: `https://${slug}.bamboohr.com/careers/${j.id}`,
          salary: null,
          salary_min: null,
          salary_max: null,
          // RawJob types these as `string | undefined` (not nullable). Use
          // `undefined` so the field is just omitted when we have no value
          // — TypeScript rejects `null` for the non-nullable optionals.
          salary_currency: undefined,
          job_type: (j.employmentStatusLabel ?? "Full-time").trim() || "Full-time",
          remote_type: isRemote ? "Remote" : undefined,
          experience_level: undefined,
          skills: [],
          tags: j.departmentLabel ? [j.departmentLabel] : [],
          posted_date: j.datePosted ?? null,
          source: "BambooHR",
          source_url: `https://${slug}.bamboohr.com/careers`,
          external_id: `bamboohr-${slug}-${j.id}`,
        };
      })
      .filter((j) => j.title && j.company);
  } catch {
    return [];
  }
}

export const bamboohr: JobSource = {
  name: "BambooHR",
  async fetch(): Promise<RawJob[]> {
    if (BAMBOOHR_COMPANIES.length === 0) return [];
    const all: RawJob[] = [];
    for (let i = 0; i < BAMBOOHR_COMPANIES.length; i += 4) {
      const batch = BAMBOOHR_COMPANIES.slice(i, i + 4);
      const results = await Promise.allSettled(batch.map(fetchBambooHRJobs));
      for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
    }
    return all;
  },
};
