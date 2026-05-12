import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

interface PriorityTask {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: string;
  completed: boolean;
}

function computeProfileCompleteness(args: {
  hasBio: boolean;
  skillsCount: number;
  workExpCount: number;
  hasResume: boolean;
  hasTitle: boolean;
}): number {
  let score = 0;
  if (args.hasBio) score += 20;
  if (args.skillsCount >= 3) score += 20;
  if (args.workExpCount >= 1) score += 20;
  if (args.hasResume) score += 20;
  if (args.hasTitle) score += 20;
  return score;
}

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dbUser, profile, careerDiagActivity, linkedinActivity, applicationsCount] =
      await Promise.all([
        prisma.users.findUnique({
          where: { id: user.id },
          select: { bio: true, skills: true, work_experience: true, position: true },
        }),
        prisma.user_profiles.findFirst({
          where: { user_id: user.id, is_default: true },
          select: { title: true, resume_text: true, resume_url: true },
        }),
        prisma.user_activities.findFirst({
          where: {
            user_id: user.id,
            activity_type: "career_diagnosis_run",
            timestamp: { gte: thirtyDaysAgo },
          },
          select: { id: true },
        }),
        prisma.user_activities.findFirst({
          where: {
            user_id: user.id,
            activity_type: "linkedin_optimizer_run",
            timestamp: { gte: thirtyDaysAgo },
          },
          select: { id: true },
        }),
        prisma.user_applications.count({ where: { user_id: user.id } }),
      ]);

    const skillsArr = Array.isArray(dbUser?.skills) ? (dbUser?.skills as unknown[]) : [];
    const workExpArr = Array.isArray(dbUser?.work_experience)
      ? (dbUser?.work_experience as unknown[])
      : [];
    const hasBio = !!dbUser?.bio && dbUser.bio.length > 0;
    const hasResume = !!(profile?.resume_text || profile?.resume_url);
    const hasTitle = !!profile?.title;

    const completeness = computeProfileCompleteness({
      hasBio,
      skillsCount: skillsArr.length,
      workExpCount: workExpArr.length,
      hasResume,
      hasTitle,
    });

    const cvCompleted = !!(profile?.resume_text && profile.resume_text.length > 500);
    const careerDiagCompleted = !!careerDiagActivity || completeness >= 60;
    const matchesReviewed = applicationsCount >= 1;
    const visibilityBoosted = !!linkedinActivity || completeness >= 80;

    const priorities: PriorityTask[] = [
      {
        id: "cv",
        title: "CV Optimization",
        description: "Get your CV scored against the roles you target and unlock recruiter-ready feedback.",
        actionLabel: cvCompleted ? "Review again" : "Start Review",
        actionHref: "/cv-review",
        icon: "FileText",
        completed: cvCompleted,
      },
      {
        id: "diagnosis",
        title: "Career Diagnosis",
        description: "Pinpoint blockers in your search and get a personalized action plan.",
        actionLabel: careerDiagCompleted ? "View results" : "Run Diagnosis",
        actionHref: "/career-diagnosis",
        icon: "Stethoscope",
        completed: careerDiagCompleted,
      },
      {
        id: "matches",
        title: "Review your matches",
        description: "Browse roles scored against your profile and apply where it counts.",
        actionLabel: matchesReviewed ? "Keep exploring" : "See Matches",
        actionHref: "/jobs",
        icon: "Search",
        completed: matchesReviewed,
      },
      {
        id: "visibility",
        title: "Boost your visibility",
        description: "Polish your LinkedIn signal so recruiters surface you in their searches.",
        actionLabel: visibilityBoosted ? "View profile" : "Optimize Now",
        actionHref: "/linkedin-optimizer",
        icon: "Eye",
        completed: visibilityBoosted,
      },
    ];

    const completedCount = priorities.filter((p) => p.completed).length;

    return NextResponse.json({
      priorities,
      completedCount,
      totalCount: 4,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
