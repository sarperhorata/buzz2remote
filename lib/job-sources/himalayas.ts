import { JobSource, RawJob } from "./types";

export const himalayas: JobSource = {
  name: "Himalayas",
  async fetch(): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];
    let offset = 0;
    const limit = 20; // Max per request

    for (let page = 0; page < 10; page++) {
      const res = await fetch(
        `https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`,
        { headers: { "User-Agent": "Buzz2Remote/1.0" } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const jobs = data.jobs || [];
      if (jobs.length === 0) break;

      for (const job of jobs) {
        allJobs.push({
          title: String(job.title || ""),
          company: String(job.companyName || ""),
          location: String(job.locationRestrictions?.join(", ") || "Remote"),
          description: String(job.description || ""),
          url: `https://himalayas.app/jobs/${job.slug || job.id}`,
          salary_min: job.minSalary ? Number(job.minSalary) : null,
          salary_max: job.maxSalary ? Number(job.maxSalary) : null,
          salary_currency: "USD",
          job_type: String(job.type || "Full-time"),
          remote_type: "Remote",
          skills: Array.isArray(job.skills) ? job.skills : [],
          tags: Array.isArray(job.categories) ? job.categories : [],
          posted_date: job.pubDate || job.postedAt || null,
          source: "Himalayas",
          source_url: `https://himalayas.app/jobs/${job.slug || job.id}`,
          external_id: `himalayas-${job.id || job.slug || ""}`,
        });
      }

      offset += limit;
    }

    return allJobs.filter((j) => j.title && j.company);
  },
};
