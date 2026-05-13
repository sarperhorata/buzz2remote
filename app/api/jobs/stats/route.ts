import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // "Be first in line" cutoff: jobs posted within the last 48h are
    // Pro-exclusive for the first 48h.
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [total, todayCount, last48hCount] = await Promise.all([
      prisma.jobs.count({ where: { is_active: true, archived: false } }),
      prisma.jobs.count({
        where: {
          is_active: true,
          archived: false,
          posted_date: { gte: today },
        },
      }),
      prisma.jobs.count({
        where: {
          is_active: true,
          archived: false,
          posted_date: { gte: fortyEightHoursAgo },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      today: todayCount,
      last48h: last48hCount,
      embargoCutoff: fortyEightHoursAgo.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
