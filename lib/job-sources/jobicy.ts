import { JobSource, RawJob } from "./types";

export const jobicy: JobSource = {
  name: "Jobicy",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    // Fetch multiple pages (max 50 per page)
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://jobicy.com/api/v2/remote-jobs?count=50&page=${page}`,
        { headers: { "User-Agent": "Buzz2Remote/1.0" } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const jobs = data.jobs || [];
      if (jobs.length === 0) break;

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
