import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError, errorResponse } from "@/lib/api-utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = ["like", "dismiss"] as const;
type InteractionType = (typeof ALLOWED_TYPES)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id: jobId } = await params;
    if (!UUID_RE.test(jobId)) return errorResponse("Invalid job id", 400);

    let body: { type?: string } = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const type = body.type as InteractionType;
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return errorResponse("type must be 'like' or 'dismiss'", 400);
    }

    const job = await prisma.jobs.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return errorResponse("Job not found", 404);

    const existing = await prisma.job_interactions.findFirst({
      where: {
        user_id: user.id,
        job_id: jobId,
        interaction_type: { in: ["like", "dismiss"] },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.job_interactions.update({
        where: { id: existing.id },
        data: { interaction_type: type, timestamp: new Date() },
      });
    } else {
      await prisma.job_interactions.create({
        data: {
          id: randomUUID(),
          job_id: jobId,
          user_id: user.id,
          interaction_type: type,
        },
      });
    }

    return NextResponse.json({ ok: true, type, jobId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id: jobId } = await params;
    if (!UUID_RE.test(jobId)) return errorResponse("Invalid job id", 400);

    await prisma.job_interactions.deleteMany({
      where: {
        user_id: user.id,
        job_id: jobId,
        interaction_type: { in: ["like", "dismiss"] },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
