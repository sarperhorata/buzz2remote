import { JobSource, RawJob } from "./types";

export const remoteok: JobSource = {
  name: "RemoteOK",
  async fetch(): Promise<RawJob[]> {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "Buzz2Remote/1.0" },
    });
    if (!res.ok) throw new Error(`RemoteOK API error: ${res.status}`);

    const data = await res.json();
    // First item is metadata, skip it
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs.map((job: Record<string, unknown>) => ({
      title: String(job.position || job.title || ""),
      company: String(job.company || ""),
      location: String(job.location || "Remote"),
      description: String(job.description || ""),
      url: String(job.url || `https://remoteok.com/l/${job.id}`),
      salary_min: job.salary_min ? Number(job.salary_min) : null,
      salary_max: job.salary_max ? Number(job.salary_max) : null,
      salary_currency: "USD",
      job_type: "Full-time",
      remote_type: "Remote",
      skills: Array.isArray(job.tags) ? (job.tags as string[]) : [],
      tags: Array.isArray(job.tags) ? (job.tags as string[]) : [],
      posted_date: job.date ? String(job.date) : null,
      source: "RemoteOK",
      source_url: String(job.url || ""),
      external_id: `remoteok-${job.id || job.slug || ""}`,
    })).filter((j: RawJob) => j.title && j.company);
  },
};
