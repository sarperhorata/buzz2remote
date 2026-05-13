import { JobSource, RawJob } from "./types";

export const jobicy: JobSource = {
  name: "Jobicy",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    // Jobicy API v2 no longer accepts `page` param (returns HTTP 400). Single
    // call with the maximum count returns the most recent jobs.
    const res = await fetch(
      `https://jobicy.com/api/v2/remote-jobs?count=100`,
      { headers: { "User-Agent": "Buzz2Remote/1.0" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    {
      for (const job of jobs) {
        allJobs.push({
          title: String(job.jobTitle || ""),
          company: String(job.companyName || ""),
          location: String(job.jobGeo || "Remote"),
          description: String(job.jobDescription || ""),
          url: String(job.url || ""),
          salary_min: job.annualSalaryMin ? Number(job.annualSalaryMin) : null,
          salary_max: job.annualSalaryMax ? Number(job.annualSalaryMax) : null,
          salary_currency: String(job.salaryCurrency || "USD"),
          job_type: String(job.jobType || "Full-time"),
          remote_type: "Remote",
          skills: Array.isArray(job.jobIndustry) ? job.jobIndustry : [],
          tags: Array.isArray(job.jobIndustry) ? job.jobIndustry : [],
          posted_date: job.pubDate || null,
          source: "Jobicy",
          source_url: String(job.url || ""),
          external_id: `jobicy-${job.id || job.jobSlug || ""}`,
        });
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
