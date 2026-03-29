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

export type { RawJob, JobSource };

export const allSources: JobSource[] = [
  // Free APIs (no auth required)
  remoteok,
  jobicy,
  remotive,
  arbeitnow,
  himalayas,
  // ATS platforms (58 + 67 + 14 + 19 = 158 company career pages)
  greenhouse,
  lever,
  ashby,
  workable,
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
