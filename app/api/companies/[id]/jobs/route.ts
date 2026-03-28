import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.companies.findUnique({ where: { id } });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const jobs = await prisma.jobs.findMany({
      where: {
        company: company.name,
        is_active: true,
        archived: false,
      },
      orderBy: { posted_date: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        salary: true,
        job_type: true,
        remote_type: true,
        posted_date: true,
        apply_url: true,
      },
    });

    return NextResponse.json({ company: company.name, jobs });
  } catch (error) {
    return handleApiError(error);
  }
}
