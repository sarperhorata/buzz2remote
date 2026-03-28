import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const jobs = await prisma.jobs.findMany({
      where: { is_active: true, archived: false },
      orderBy: { posted_date: "desc" },
      take: 20,
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
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return handleApiError(error);
  }
}
