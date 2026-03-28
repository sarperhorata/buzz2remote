import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jobSearchSchema, jobCreateSchema } from "@/lib/validators/job";
import { requireAdmin, handleApiError, parseSearchParams } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.url);
    const parsed = jobSearchSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { q, location, job_type, remote_type, experience_level, salary_min, salary_max, skills, page, limit, sort } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { is_active: true, archived: false };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (job_type) where.job_type = job_type;
    if (remote_type) where.remote_type = remote_type;
    if (experience_level) where.experience_level = experience_level;
    if (salary_min) where.salary_min = { gte: salary_min };
    if (salary_max) where.salary_max = { lte: salary_max };

    const orderBy = sort === "salary"
      ? { salary_max: "desc" as const }
      : { posted_date: "desc" as const };

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          salary_min: true,
          salary_max: true,
          salary_currency: true,
          job_type: true,
          experience_level: true,
          remote_type: true,
          work_type: true,
          skills: true,
          apply_url: true,
          posted_date: true,
          created_at: true,
          views_count: true,
          is_remote: true,
        },
      }),
      prisma.jobs.count({
        where,
      }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: { "X-Total-Count": total.toString() },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = jobCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const job = await prisma.jobs.create({
      data: {
        id: crypto.randomUUID(),
        ...parsed.data,
        skills: parsed.data.skills ?? [],
        tags: parsed.data.tags ?? [],
        is_active: true,
        archived: false,
        is_translated: false,
        views_count: 0,
        applications_count: 0,
        posted_date: new Date(),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
