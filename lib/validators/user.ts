import { z } from "zod";

export const userUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
  skills: z.array(z.object({ name: z.string() })).optional(),
  work_experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    description: z.string().optional(),
    is_current: z.boolean().optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    field: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })).optional(),
  social_links: z.record(z.string(), z.string()).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
