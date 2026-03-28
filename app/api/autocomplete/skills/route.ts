import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Extract unique skills from jobs using raw query
    const skills = await prisma.$queryRaw<Array<{ skill: string }>>`
      SELECT DISTINCT jsonb_array_elements_text(skills) as skill
      FROM jobs
      WHERE is_active = true
        AND skills IS NOT NULL
        AND jsonb_array_elements_text(skills) ILIKE ${'%' + q + '%'}
      LIMIT 10
    `;

    return NextResponse.json({
      suggestions: skills.map((s) => s.skill),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
