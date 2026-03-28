import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const jobs = await prisma.jobs.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        is_active: true,
      },
      select: { title: true },
      distinct: ["title"],
      take: 10,
    });

    return NextResponse.json({
      suggestions: jobs.map((j) => j.title),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
