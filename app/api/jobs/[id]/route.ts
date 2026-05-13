import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // SECURITY: explicit select — apply_url and source_url are intentionally
    // omitted. They're only accessible via the auth-gated
    // /api/jobs/[id]/apply redirect endpoint (server-side, never sent to client).
    // We expose a `has_apply_url` boolean so the UI can show/hide the Apply
    // button without ever shipping the real ATS URL to JavaScript.
    const job = await prisma.jobs.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        description: true,
        requirements: true,
        benefits: true,
        salary: true,
        salary_min: true,
        salary_max: true,
        salary_currency: true,
        salary_range: true,
        job_type: true,
        experience_level: true,
        remote_type: true,
        work_type: true,
        seniority_level: true,
        skills: true,
        tags: true,
        source: true,
        source_type: true,
        is_active: true,
        is_remote: true,
        views_count: true,
        applications_count: true,
        applicant_count: true,
        posted_date: true,
        last_updated: true,
        created_at: true,
        updated_at: true,
        apply_url: true,   // selected here only to compute has_apply_url below
        source_url: true,  // selected here only to compute has_apply_url below
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.jobs.update({
      where: { id },
      data: { views_count: { increment: 1 } },
    });

    // Strip sensitive URLs from the response — replace with a boolean.
    const { apply_url, source_url, ...safeJob } = job;
    const responseJob = {
      ...safeJob,
      has_apply_url: !!(apply_url || source_url),
    };

    return NextResponse.json(responseJob);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const job = await prisma.jobs.update({
      where: { id },
      data: { ...body, updated_at: new Date() },
    });

    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    await prisma.jobs.delete({ where: { id } });

    return NextResponse.json({ message: "Job deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
