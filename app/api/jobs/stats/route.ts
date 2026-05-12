import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount] = await Promise.all([
      prisma.jobs.count({ where: { is_active: true, archived: false } }),
      prisma.jobs.count({
        where: {
          is_active: true,
          archived: false,
          posted_date: { gte: today },
        },
      }),
    ]);

    return NextResponse.json({ total, today: todayCount });
  } catch (error) {
    return handleApiError(error);
  }
}
