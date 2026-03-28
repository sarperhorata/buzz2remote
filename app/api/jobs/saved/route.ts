import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const savedInteractions = await prisma.job_interactions.findMany({
      where: { user_id: user.id, interaction_type: "save" },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            salary_min: true,
            salary_max: true,
            salary_currency: true,
            job_type: true,
            remote_type: true,
            skills: true,
            apply_url: true,
            posted_date: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const jobs = savedInteractions.map((i) => i.jobs);

    return NextResponse.json({ jobs });
  } catch (error) {
    return handleApiError(error);
  }
}
