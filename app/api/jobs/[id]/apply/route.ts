import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check — requireAuth uses getServerSession internally
  const { user, error } = await requireAuth();
  if (!user) {
    // Redirect to login with callback
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=/jobs/${id}`, request.url)
    );
  }

  // Get the job
  const job = await prisma.jobs.findUnique({
    where: { id },
    select: { apply_url: true, source_url: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const applyUrl = job.apply_url || job.source_url;
  if (!applyUrl) {
    return NextResponse.json({ error: "No apply URL available" }, { status: 404 });
  }

  // Track click — increment applications_count
  await prisma.jobs.update({
    where: { id },
    data: { applications_count: { increment: 1 } },
  });

  // Redirect to actual apply URL
  return NextResponse.redirect(applyUrl);
}
