import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { applicationCreateSchema } from "@/lib/validators/application";

// Get user's applications
export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const applications = await prisma.user_applications.findMany({
      where: { user_id: user.id },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            job_type: true,
            remote_type: true,
            apply_url: true,
          },
        },
      },
      orderBy: { applied_at: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return handleApiError(error);
  }
}

// Create application (apply for job)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const parsed = applicationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if already applied
    const existing = await prisma.user_applications.findFirst({
      where: { user_id: user.id, job_id: parsed.data.job_id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied to this job" },
        { status: 409 }
      );
    }

    const application = await prisma.user_applications.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        job_id: parsed.data.job_id,
        status: "applied",
        application_type: parsed.data.application_type,
        cover_letter: parsed.data.cover_letter,
        resume_url: parsed.data.resume_url,
        additional_notes: parsed.data.additional_notes,
        viewed_by_company: false,
      },
    });

    // Increment job application count
    await prisma.jobs.update({
      where: { id: parsed.data.job_id },
      data: { applications_count: { increment: 1 } },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
