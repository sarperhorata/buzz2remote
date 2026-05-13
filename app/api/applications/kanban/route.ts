import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export interface KanbanItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  salary_range: { min: number | null; max: number | null; currency: string | null };
  remote_type: string | null;
  clickedAt: string | null;
  appliedAt: string | null;
  isActive: boolean;
  source: string | null;
}

export interface KanbanResponse {
  likes: KanbanItem[];
  applyClicks: KanbanItem[];
  applied: KanbanItem[];
  expired: KanbanItem[];
  counts: { likes: number; applyClicks: number; applied: number; expired: number };
}

type JobFields = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  remote_type: string | null;
  is_active: boolean;
  archived: boolean;
  source: string | null;
  posted_date: Date | null;
};

function toKanbanItem(
  job: JobFields,
  opts: { clickedAt?: Date | null; appliedAt?: Date | null }
): KanbanItem {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    salary_range: {
      min: job.salary_min,
      max: job.salary_max,
      currency: job.salary_currency,
    },
    remote_type: job.remote_type,
    clickedAt: opts.clickedAt ? opts.clickedAt.toISOString() : null,
    appliedAt: opts.appliedAt ? opts.appliedAt.toISOString() : null,
    isActive: job.is_active && !job.archived,
    source: job.source,
  };
}

const JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  location: true,
  salary: true,
  salary_min: true,
  salary_max: true,
  salary_currency: true,
  remote_type: true,
  is_active: true,
  archived: true,
  source: true,
  posted_date: true,
} as const;

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const userId = user!.id as string;

    // Parallel fetch
    const [likeInteractions, applications] = await Promise.all([
      prisma.job_interactions.findMany({
        where: { user_id: userId, interaction_type: "like" },
        orderBy: { timestamp: "desc" },
        select: {
          job_id: true,
          timestamp: true,
          jobs: { select: JOB_SELECT },
        },
      }),
      prisma.user_applications.findMany({
        where: { user_id: userId },
        orderBy: { applied_at: "desc" },
        select: {
          job_id: true,
          status: true,
          viewed_by_company: true,
          applied_at: true,
          jobs: { select: JOB_SELECT },
        },
      }),
    ]);

    const appliedJobIds = new Set(applications.map((a) => a.job_id));

    // Buckets
    const expired: KanbanItem[] = [];
    const applied: KanbanItem[] = [];
    const applyClicks: KanbanItem[] = [];

    for (const app of applications) {
      const job = app.jobs;
      if (!job) continue;

      // Expired: job no longer active
      if (!job.is_active || job.archived) {
        expired.push(toKanbanItem(job, { appliedAt: app.applied_at }));
        continue;
      }

      // Applied bucket: confirmed/interviewing/offered/rejected, or viewed by company
      const status = (app.status || "").toLowerCase();
      const isAppliedBucket =
        app.viewed_by_company ||
        status === "confirmed" ||
        status === "confirmed_applied" ||
        status === "interviewing" ||
        status === "offered" ||
        status === "rejected" ||
        status === "closed";

      if (isAppliedBucket) {
        applied.push(toKanbanItem(job, { appliedAt: app.applied_at }));
      } else {
        // Default: 'applied' / 'pending' / unknown → Apply Clicks
        applyClicks.push(toKanbanItem(job, { clickedAt: app.applied_at }));
      }
    }

    // Likes: filter out ones already in user_applications
    const likes: KanbanItem[] = [];
    for (const like of likeInteractions) {
      if (appliedJobIds.has(like.job_id)) continue;
      const job = like.jobs;
      if (!job) continue;
      // If job is expired, push to expired bucket? Per spec, expired is about applications.
      // Keep likes column for liked items, even if job expired.
      likes.push(toKanbanItem(job, { clickedAt: like.timestamp }));
    }

    const response: KanbanResponse = {
      likes,
      applyClicks,
      applied,
      expired,
      counts: {
        likes: likes.length,
        applyClicks: applyClicks.length,
        applied: applied.length,
        expired: expired.length,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err);
  }
}
