import { JobSource, RawJob } from "./types";
import { remoteok } from "./remoteok";
import { jobicy } from "./jobicy";
import { remotive } from "./remotive";
import { arbeitnow } from "./arbeitnow";
import { himalayas } from "./himalayas";
import { greenhouse } from "./greenhouse";
import { lever } from "./lever";
import { ashby } from "./ashby";
import { workable } from "./workable";
import { breezy } from "./breezy";
import { freshteam } from "./freshteam";
import { smartrecruiters } from "./smartrecruiters-source";
import { recruitee } from "./recruitee-source";
import { personio } from "./personio";
import { bamboohr } from "./bamboohr";
// pinpointhq + teamtailor are skeleton-only (require API keys or JS
// rendering); their fetch() returns [] until enabled. Imported for type
// completeness but NOT added to allSources yet.
// import { pinpointhq } from "./pinpointhq";
// import { teamtailor } from "./teamtailor";

export type { RawJob, JobSource };

export const allSources: JobSource[] = [
  // Free APIs (no auth required)
  remoteok,
  jobicy,
  remotive,
  arbeitnow,
  himalayas,
  // ATS platforms — 261 unique company career pages across 10 ATS providers
  // (after +39 embedded-ATS-detection slugs and +8 new BambooHR/Personio).
  greenhouse,
  lever,
  ashby,
  workable,
  breezy,
  freshteam,
  smartrecruiters,
  recruitee,
  personio,
  bamboohr,
];

export interface FetchResult {
  source: string;
  jobs: RawJob[];
  error?: string;
  duration: number;
}

/**
 * Fetch jobs from all sources in parallel.
 * Returns results per source (including errors).
 */
export async function fetchAllJobs(): Promise<FetchResult[]> {
  const results = await Promise.allSettled(
    allSources.map(async (source) => {
      const start = Date.now();
      try {
        const jobs = await source.fetch();
        return {
          source: source.name,
          jobs,
          duration: Date.now() - start,
        };
      } catch (error) {
        return {
          source: source.name,
          jobs: [],
          error: String(error),
          duration: Date.now() - start,
        };
      }
    })
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { source: "unknown", jobs: [], error: String(r.reason), duration: 0 }
  );
}
