import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const [totalJobs, activeJobs, totalCompanies, totalApplications] =
      await Promise.all([
        prisma.jobs.count(),
        prisma.jobs.count({ where: { is_active: true, archived: false } }),
        prisma.companies.count({ where: { is_active: true } }),
        prisma.user_applications.count(),
      ]);

    // Job type distribution
    const jobTypes = await prisma.jobs.groupBy({
      by: ["job_type"],
      where: { is_active: true },
      _count: true,
    });

    return NextResponse.json({
      totalJobs,
      activeJobs,
      totalCompanies,
      totalApplications,
      jobTypeDistribution: jobTypes.map((jt) => ({
        type: jt.job_type ?? "Unknown",
        count: jt._count,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
