import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

type DemandLevel = "low" | "moderate" | "high" | "very high";
type VisibilityLevel = "very low" | "low" | "moderate" | "high";

function demandLevelFromCount(count: number): { level: DemandLevel; label: string } {
  if (count < 100) return { level: "low", label: "Low" };
  if (count < 1000) return { level: "moderate", label: "Moderate" };
  if (count < 5000) return { level: "high", label: "High" };
  return { level: "very high", label: "Very High" };
}

function visibilityLevelFromScore(score: number): { level: VisibilityLevel; label: string } {
  if (score <= 30) return { level: "very low", label: "Very Low" };
  if (score <= 60) return { level: "low", label: "Low" };
  if (score <= 85) return { level: "moderate", label: "Moderate" };
  return { level: "high", label: "High" };
}

function headlineFor(demand: DemandLevel, visibility: VisibilityLevel): string {
  const highDemand = demand === "high" || demand === "very high";
  const lowVis = visibility === "very low" || visibility === "low";
  const highVis = visibility === "high";

  if (highDemand && lowVis) return "Strong market demand, but you're not visible yet";
  if (highDemand && highVis) return "You're well-positioned in a hot market";
  if (highDemand) return "There's strong demand — let's sharpen your edge";
  if (demand === "moderate" && lowVis) return "Steady market — visibility is your bottleneck";
  if (demand === "moderate" && highVis) return "You're ready for a steady market";
  if (demand === "low" && highVis) return "Profile is strong but the market is quiet right now";
  if (demand === "low") return "Quiet market — focus on standing out when it picks up";
  return "Let's build your job-search momentum";
}

function visibilityHintFor(level: VisibilityLevel, missing: string[]): string {
  if (level === "very low") return "Start with CV optimization to get noticed";
  if (level === "low") {
    if (missing.includes("skills")) return "Add more skills to improve match quality";
    if (missing.includes("resume")) return "Upload your resume so recruiters can find you";
    return "Strengthen your profile to climb match rankings";
  }
  if (level === "moderate") return "You're on the map — a few tweaks will push you to the top";
  return "Great visibility — keep your profile fresh to stay there";
}

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const [dbUser, profile] = await Promise.all([
      prisma.users.findUnique({
        where: { id: user.id },
        select: {
          position: true,
          skills: true,
          bio: true,
          work_experience: true,
          subscription_plan: true,
        },
      }),
      prisma.user_profiles.findFirst({
        where: { user_id: user.id, is_default: true },
        select: { title: true, skills: true, resume_text: true, resume_url: true },
      }),
    ]);

    const targetRole =
      profile?.title?.trim() ||
      dbUser?.position?.trim() ||
      "Software Engineer";

    // Use first word of target role for ILIKE matching
    const firstKeyword = targetRole.split(/\s+/)[0]?.toLowerCase() ?? "";

    let count = 0;
    if (firstKeyword) {
      count = await prisma.jobs.count({
        where: {
          is_active: true,
          archived: false,
          title: { contains: firstKeyword, mode: "insensitive" },
        },
      });
    }

    const demand = demandLevelFromCount(count);

    // Visibility score from profile completeness
    const skillsArr = Array.isArray(dbUser?.skills) ? (dbUser?.skills as unknown[]) : [];
    const workExpArr = Array.isArray(dbUser?.work_experience)
      ? (dbUser?.work_experience as unknown[])
      : [];

    const hasBio = !!dbUser?.bio && dbUser.bio.length > 0;
    const hasSkills = skillsArr.length >= 3;
    const hasWorkExp = workExpArr.length >= 1;
    const hasResume = !!(profile?.resume_text || profile?.resume_url);
    const hasTitle = !!profile?.title;

    let score = 0;
    const missing: string[] = [];
    if (hasBio) score += 20;
    else missing.push("bio");
    if (hasSkills) score += 20;
    else missing.push("skills");
    if (hasWorkExp) score += 20;
    else missing.push("experience");
    if (hasResume) score += 20;
    else missing.push("resume");
    if (hasTitle) score += 20;
    else missing.push("title");

    const visibility = visibilityLevelFromScore(score);
    const headline = headlineFor(demand.level, visibility.level);
    const hint = visibilityHintFor(visibility.level, missing);

    return NextResponse.json({
      targetRole,
      demand: { level: demand.level, label: demand.label, count },
      visibility: { score, level: visibility.level, label: visibility.label, hint },
      headline,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
