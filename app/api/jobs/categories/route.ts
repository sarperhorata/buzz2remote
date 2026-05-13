import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { classifyJobTitle } from "@/lib/job-categories";

export async function GET() {
  try {
    const jobs = await prisma.jobs.findMany({
      where: { is_active: true, archived: false },
      select: { title: true },
    });

    const counts: Record<string, number> = {};
    for (const job of jobs) {
      const category = classifyJobTitle(job.title);
      counts[category] = (counts[category] ?? 0) + 1;
    }

    // Sort by count desc, take top 8
    const sorted = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Prepend "All" with total count
    const result = [
      { category: "All", count: jobs.length },
      ...sorted,
    ];

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
