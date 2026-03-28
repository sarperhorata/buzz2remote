import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.jobs.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.jobs.update({
      where: { id },
      data: { views_count: { increment: 1 } },
    });

    return NextResponse.json(job);
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
