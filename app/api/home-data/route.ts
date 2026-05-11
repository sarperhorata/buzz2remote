import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [activeJobs, uniqueCompaniesResult, recentJobs] = await Promise.all([
      prisma.jobs.count({ where: { is_active: true, archived: false } }),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(DISTINCT company) as count FROM jobs WHERE is_active = true`,
      prisma.jobs.findMany({
        where: { is_active: true, archived: false },
        orderBy: { posted_date: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary_min: true,
          salary_max: true,
          salary_currency: true,
          remote_type: true,
          job_type: true,
          posted_date: true,
        },
      }),
    ]);

    return NextResponse.json({
      activeJobs,
      totalCompanies: Number(uniqueCompaniesResult[0]?.count ?? 0),
      recentJobs,
    });
  } catch (error) {
    console.error("home-data error:", error);
    return NextResponse.json(
      { activeJobs: 0, totalCompanies: 0, recentJobs: [] },
      { status: 200 }
    );
  }
}
