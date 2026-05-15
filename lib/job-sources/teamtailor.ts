import { JobSource, RawJob } from "./types";

/**
 * Teamtailor (Swedish ATS, popular with Nordic tech).
 *
 * STATUS: SKELETON ONLY — not currently enabled.
 *
 * Public-facing career pages typically live on a custom domain
 * (career.{company}.com) or on {slug}.teamtailor.com. Either way the
 * jobs list is rendered server-side as HTML — but the structure varies
 * heavily per tenant because Teamtailor lets each customer choose their
 * own page template. There's no consistent CSS selector across tenants
 * that we could lean on.
 *
 * The proper API (api.teamtailor.com/v1/jobs) requires a tenant-issued
 * Bearer token, which we can't get without each company explicitly
 * granting us access.
 *
 * Distill has only 2 Teamtailor entries and the embedded-ATS pilot's
 * "Teamtailor" hits were false positives (matched generic `app.` and
 * `www.` subdomains). Not worth a Playwright pipeline for 2 tenants.
 *
 * Skeleton kept here so this becomes a no-op until either (a) we add a
 * headless-browser worker, or (b) the integration becomes worth a
 * per-tenant onboarding (e.g. partnering with a Teamtailor customer).
 */
const TEAMTAILOR_COMPANIES: Array<string> = [];

// Stub fetcher — currently a no-op. Kept exported so adding it to the
// allSources list later is a single-line change.
async function fetchTeamtailorJobs(_slug: string): Promise<RawJob[]> {
  return [];
}

export const teamtailor: JobSource = {
  name: "Teamtailor",
  async fetch(): Promise<RawJob[]> {
    if (TEAMTAILOR_COMPANIES.length === 0) return [];
    const all: RawJob[] = [];
    for (const slug of TEAMTAILOR_COMPANIES) {
      all.push(...(await fetchTeamtailorJobs(slug)));
    }
    return all;
  },
};
