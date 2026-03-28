import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const companies = await prisma.companies.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        is_active: true,
      },
      select: { name: true, logo_url: true },
      take: 10,
    });

    return NextResponse.json({ suggestions: companies });
  } catch (error) {
    return handleApiError(error);
  }
}
