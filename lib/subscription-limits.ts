import { prisma } from "@/lib/db";

export type SubscriptionPlan = "free" | "pro" | "premium" | null;

const PLAN_LIMITS = {
  free: { profiles: 1, applicationsPerMonth: 10, aiCvAnalysis: false, salaryEstimation: false, coverLetter: false, autoApply: false, linkedinImport: false },
  pro: { profiles: 3, applicationsPerMonth: Infinity, aiCvAnalysis: true, salaryEstimation: true, coverLetter: true, autoApply: false, linkedinImport: false },
  premium: { profiles: Infinity, applicationsPerMonth: Infinity, aiCvAnalysis: true, salaryEstimation: true, coverLetter: true, autoApply: true, linkedinImport: true },
} as const;

export function hasActiveSubscription(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

function normalizePlan(plan: string | null | undefined, status?: string | null): keyof typeof PLAN_LIMITS {
  // During a trial, treat the plan as its paid equivalent
  if (status === "trialing") {
    const p = (plan || "free").toLowerCase();
    if (p === "pro") return "pro";
    if (p === "premium") return "premium";
  }
  const p = (plan || "free").toLowerCase();
  if (p === "pro") return "pro";
  if (p === "premium") return "premium";
  return "free";
}

export function getPlanLimits(plan: string | null | undefined, status?: string | null) {
  return PLAN_LIMITS[normalizePlan(plan, status)];
}

export function getProfileLimit(plan: string | null | undefined, status?: string | null): number {
  return getPlanLimits(plan, status).profiles;
}

export async function canCreateProfile(userId: string, plan: string | null | undefined): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = getProfileLimit(plan);
  const current = await prisma.user_profiles.count({ where: { user_id: userId } });
  return { allowed: current < limit, current, limit };
}

export function hasFeature(plan: string | null | undefined, feature: keyof typeof PLAN_LIMITS.free, status?: string | null): boolean {
  const limits = getPlanLimits(plan, status);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}
