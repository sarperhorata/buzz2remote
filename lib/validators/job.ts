import { z } from "zod";

export const jobSearchSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  job_type: z.string().optional(),
  remote_type: z.string().optional(),
  experience_level: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  skills: z.string().optional(), // comma-separated
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["recent", "relevant", "salary"]).default("recent"),
});

export const jobCreateSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_currency: z.string().default("USD"),
  job_type: z.string().optional(),
  experience_level: z.string().optional(),
  remote_type: z.string().optional(),
  work_type: z.string().optional(),
  skills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  apply_url: z.string().url().optional(),
  source: z.string().optional(),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
