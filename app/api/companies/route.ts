import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, parseSearchParams } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.page || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || "20")));
    const q = params.q;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { is_active: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.companies.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          logo_url: true,
          location: true,
          industry: true,
          size: true,
          remote_policy: true,
          tech_stack: true,
        },
      }),
      prisma.companies.count({ where }),
    ]);

    return NextResponse.json({ companies, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
