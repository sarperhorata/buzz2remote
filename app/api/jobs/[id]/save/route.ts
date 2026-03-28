import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

// Bookmark/save a job
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id: jobId } = await params;

    // Use job_interactions table for saves
    const existing = await prisma.job_interactions.findFirst({
      where: { job_id: jobId, user_id: user.id, interaction_type: "save" },
    });

    if (existing) {
      return NextResponse.json({ message: "Already saved" });
    }

    await prisma.job_interactions.create({
      data: {
        id: crypto.randomUUID(),
        job_id: jobId,
        user_id: user.id,
        interaction_type: "save",
      },
    });

    return NextResponse.json({ message: "Job saved" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Remove saved job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id: jobId } = await params;

    const interaction = await prisma.job_interactions.findFirst({
      where: { job_id: jobId, user_id: user.id, interaction_type: "save" },
    });

    if (interaction) {
      await prisma.job_interactions.delete({ where: { id: interaction.id } });
    }

    return NextResponse.json({ message: "Job unsaved" });
  } catch (error) {
    return handleApiError(error);
  }
}
