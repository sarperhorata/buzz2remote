import { JobSource, RawJob } from "./types";

export const arbeitnow: JobSource = {
  name: "Arbeitnow",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
        { headers: { "User-Agent": "Buzz2Remote/1.0" } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const jobs = data.data || [];
      if (jobs.length === 0) break;

      for (const job of jobs) {
        // Only include remote jobs
        if (!job.remote) continue;

        allJobs.push({
          title: String(job.title || ""),
          company: String(job.company_name || ""),
          location: String(job.location || "Remote"),
          description: String(job.description || ""),
          url: String(job.url || ""),
          salary: null,
          job_type: "Full-time",
          remote_type: "Remote",
          tags: Array.isArray(job.tags) ? job.tags : [],
          skills: Array.isArray(job.tags) ? job.tags : [],
          posted_date: job.created_at ? String(job.created_at) : null,
          source: "Arbeitnow",
          source_url: String(job.url || ""),
          external_id: `arbeitnow-${job.slug || job.id || ""}`,
        });
      }
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
