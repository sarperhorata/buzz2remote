import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSearchParams, handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.url);
    const q = params.q || "";
    const page = Math.max(1, parseInt(params.page || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || "20")));
    const offset = (page - 1) * limit;

    if (!q) {
      return NextResponse.json({ jobs: [], total: 0, page, limit });
    }

    // Try full-text search with TSVECTOR, fallback to ilike
    const jobs = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT id, title, company, location, salary, salary_min, salary_max,
             salary_currency, job_type, experience_level, remote_type,
             work_type, skills, apply_url, posted_date, created_at, views_count
      FROM jobs
      WHERE is_active = true AND archived = false
        AND (
          search_vector @@ plainto_tsquery('english', ${q})
          OR title ILIKE ${'%' + q + '%'}
          OR company ILIKE ${'%' + q + '%'}
          OR description ILIKE ${'%' + q + '%'}
        )
      ORDER BY
        CASE WHEN search_vector @@ plainto_tsquery('english', ${q}) THEN 0 ELSE 1 END,
        posted_date DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM jobs
      WHERE is_active = true AND archived = false
        AND (
          search_vector @@ plainto_tsquery('english', ${q})
          OR title ILIKE ${'%' + q + '%'}
          OR company ILIKE ${'%' + q + '%'}
          OR description ILIKE ${'%' + q + '%'}
        )
    `;

    const total = Number(countResult[0].count);

    return NextResponse.json({
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
