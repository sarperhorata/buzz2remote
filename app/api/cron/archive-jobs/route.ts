import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Archive jobs older than 30 days
    const result = await prisma.jobs.updateMany({
      where: {
        is_active: true,
        archived: false,
        posted_date: { lt: thirtyDaysAgo },
      },
      data: { archived: true, is_active: false },
    });

    return NextResponse.json({
      message: `Archived ${result.count} old jobs`,
      archivedCount: result.count,
    });
  } catch (error) {
    console.error("Cron archive-jobs error:", error);
    return NextResponse.json({ error: "Failed to archive jobs" }, { status: 500 });
  }
}
