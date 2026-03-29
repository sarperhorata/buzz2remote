import { JobSource, RawJob } from "./types";

export const remotive: JobSource = {
  name: "Remotive",
  async fetch(): Promise<RawJob[]> {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=100", {
      headers: { "User-Agent": "Buzz2Remote/1.0" },
    });
    if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs.map((job: Record<string, unknown>) => ({
      title: String(job.title || ""),
      company: String(job.company_name || ""),
      location: String(job.candidate_required_location || "Remote"),
      description: String(job.description || ""),
      url: String(job.url || ""),
      salary: job.salary ? String(job.salary) : null,
      job_type: String(job.job_type || ""),
      remote_type: "Remote",
      tags: Array.isArray(job.tags) ? (job.tags as string[]) : [],
      skills: Array.isArray(job.tags) ? (job.tags as string[]) : [],
      posted_date: job.publication_date ? String(job.publication_date) : null,
      source: "Remotive",
      source_url: String(job.url || ""),
      external_id: `remotive-${job.id || ""}`,
    })).filter((j: RawJob) => j.title && j.company);
  },
};
