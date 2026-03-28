import { z } from "zod";

export const applicationCreateSchema = z.object({
  job_id: z.string().uuid(),
  cover_letter: z.string().optional(),
  resume_url: z.string().url().optional(),
  additional_notes: z.string().optional(),
  application_type: z.enum(["external", "internal", "auto"]).default("external"),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(["applied", "viewed", "rejected", "accepted", "withdrawn"]).optional(),
  cover_letter: z.string().optional(),
  additional_notes: z.string().optional(),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
