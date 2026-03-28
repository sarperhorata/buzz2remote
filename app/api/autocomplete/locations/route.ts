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
        location: { contains: q, mode: "insensitive" },
        is_active: true,
      },
      select: { location: true },
      distinct: ["location"],
      take: 10,
    });

    return NextResponse.json({
      suggestions: jobs.filter((j) => j.location).map((j) => j.location!),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
