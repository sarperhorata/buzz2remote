import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { classifyJobTitle } from "@/lib/job-categories";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [dbUser, profile] = await Promise.all([
      prisma.users.findUnique({
        where: { id: user.id },
        select: { position: true },
      }),
      prisma.user_profiles.findFirst({
        where: { user_id: user.id, is_default: true },
        select: { title: true },
      }),
    ]);

    const targetRole = profile?.title?.trim() || dbUser?.position?.trim() || "";
    const firstKeyword = targetRole.split(/\s+/)[0]?.toLowerCase() ?? "";

    const baseWhere = { is_active: true, archived: false } as const;
    const matchWhere = firstKeyword
      ? { ...baseWhere, title: { contains: firstKeyword, mode: "insensitive" as const } }
      : baseWhere;

    const [newThisWeek, activeMatches, jobsApplied, likedCount, matchedJobs] = await Promise.all([
      prisma.jobs.count({
        where: { ...baseWhere, posted_date: { gte: sevenDaysAgo } },
      }),
      prisma.jobs.count({ where: matchWhere }),
      prisma.user_applications.count({ where: { user_id: user.id } }),
      prisma.job_interactions.count({
        where: { user_id: user.id, interaction_type: "like" },
      }),
      prisma.jobs.findMany({
        where: matchWhere,
        orderBy: { posted_date: "desc" },
        take: 100,
        select: { title: true, company: true },
      }),
    ]);

    // Top industries via classifyJobTitle
    const industryCounts = new Map<string, number>();
    for (const j of matchedJobs) {
      const cat = classifyJobTitle(j.title);
      industryCounts.set(cat, (industryCounts.get(cat) ?? 0) + 1);
    }
    const topIndustries = [...industryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat]) => cat);

    // Top unique companies
    const seenCompanies = new Set<string>();
    const companiesHiring: string[] = [];
    for (const j of matchedJobs) {
      if (j.company && !seenCompanies.has(j.company)) {
        seenCompanies.add(j.company);
        companiesHiring.push(j.company);
        if (companiesHiring.length >= 12) break;
      }
    }

    return NextResponse.json({
      newThisWeek,
      activeMatches,
      jobsApplied,
      likedCount,
      topIndustries,
      companiesHiring,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
