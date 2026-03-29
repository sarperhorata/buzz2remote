import { prisma } from "./db";
import { RawJob, fetchAllJobs, FetchResult } from "./job-sources";
import { randomUUID } from "crypto";

/**
 * Normalize a raw job into the DB-ready format.
 */
function normalizeJob(raw: RawJob) {
  // Parse posted_date
  let postedDate: Date | null = null;
  if (raw.posted_date) {
    if (typeof raw.posted_date === "number") {
      // Unix timestamp (seconds)
      postedDate = new Date(raw.posted_date > 1e12 ? raw.posted_date : raw.posted_date * 1000);
    } else {
      postedDate = new Date(raw.posted_date);
    }
    if (isNaN(postedDate.getTime())) postedDate = null;
  }

  // Clean HTML from description
  const cleanDesc = raw.description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);

  // Parse salary string if no min/max
  let salaryMin = raw.salary_min || null;
  let salaryMax = raw.salary_max || null;
  let salaryStr = raw.salary || null;

  if (!salaryMin && !salaryMax && raw.salary) {
    const matches = raw.salary.match(/[\d,]+/g);
    if (matches && matches.length >= 2) {
      salaryMin = parseInt(matches[0].replace(/,/g, ""));
      salaryMax = parseInt(matches[1].replace(/,/g, ""));
    } else if (matches && matches.length === 1) {
      salaryMin = parseInt(matches[0].replace(/,/g, ""));
    }
  }

  if (salaryMin && salaryMax) {
    salaryStr = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }

  return {
    id: randomUUID(),
    title: raw.title.trim().slice(0, 500),
    company: raw.company.trim().slice(0, 255),
    location: (raw.location || "Remote").trim().slice(0, 500),
    description: cleanDesc,
    salary: salaryStr,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: raw.salary_currency || "USD",
    job_type: (raw.job_type || "Full-time").slice(0, 50),
    remote_type: (raw.remote_type || "Remote").slice(0, 50),
    experience_level: raw.experience_level || null,
    skills: raw.skills && raw.skills.length > 0 ? raw.skills : [],
    tags: raw.tags && raw.tags.length > 0 ? raw.tags : [],
    apply_url: raw.url?.slice(0, 1024) || null,
    source: raw.source.slice(0, 100),
    source_url: raw.source_url?.slice(0, 1024) || raw.url?.slice(0, 1024) || null,
    external_id: raw.external_id.slice(0, 255),
    is_active: true,
    is_remote: true,
    archived: false,
    is_translated: false,
    original_language: "en",
    posted_date: postedDate || new Date(),
    views_count: 0,
    applications_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export interface ImportResult {
  totalFetched: number;
  imported: number;
  skippedDuplicates: number;
  errors: number;
  sources: Array<{ source: string; fetched: number; imported: number; error?: string }>;
}

/**
 * Fetch from all sources and import into the database.
 * Uses upsert with (source, external_id) to avoid duplicates.
 */
export async function importJobs(): Promise<ImportResult> {
  const fetchResults: FetchResult[] = await fetchAllJobs();

  let totalFetched = 0;
  let imported = 0;
  let skippedDuplicates = 0;
  let errors = 0;
  const sourceResults: ImportResult["sources"] = [];

  for (const result of fetchResults) {
    totalFetched += result.jobs.length;
    let sourceImported = 0;

    if (result.error) {
      sourceResults.push({
        source: result.source,
        fetched: 0,
        imported: 0,
        error: result.error,
      });
      continue;
    }

    // Import in batches of 50
    for (let i = 0; i < result.jobs.length; i += 50) {
      const batch = result.jobs.slice(i, i + 50);

      for (const rawJob of batch) {
        try {
          const normalized = normalizeJob(rawJob);

          // Check for existing job by source + external_id
          const existing = await prisma.jobs.findFirst({
            where: {
              source: normalized.source,
              external_id: normalized.external_id,
            },
            select: { id: true },
          });

          if (existing) {
            // Update existing job (refresh data)
            await prisma.jobs.update({
              where: { id: existing.id },
              data: {
                title: normalized.title,
                description: normalized.description,
                salary: normalized.salary,
                salary_min: normalized.salary_min,
                salary_max: normalized.salary_max,
                is_active: true,
                updated_at: new Date(),
              },
            });
            skippedDuplicates++;
          } else {
            // Create new job
            await prisma.jobs.create({
              data: normalized,
            });
            sourceImported++;
            imported++;
          }
        } catch (err) {
          errors++;
          console.error(`Failed to import job: ${rawJob.title}`, err);
        }
      }
    }

    sourceResults.push({
      source: result.source,
      fetched: result.jobs.length,
      imported: sourceImported,
    });
  }

  return { totalFetched, imported, skippedDuplicates, errors, sources: sourceResults };
}
