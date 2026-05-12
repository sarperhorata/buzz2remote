import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError, errorResponse } from "@/lib/api-utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STOPWORDS = new Set([
  "senior", "junior", "lead", "the", "a", "of", "and", "or", "to", "for",
  "in", "at", "on", "principal", "staff", "mid", "level", "i", "ii", "iii",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function computeScore(
  userSkills: string[],
  userTitle: string,
  job: { title: string; skills: unknown; experience_level: string | null },
  isPro: boolean
): number | null {
  if (!userSkills.length && !userTitle) return null;

  const jobSkillsRaw: string[] = Array.isArray(job.skills)
    ? (job.skills as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const jobSkillsLower = jobSkillsRaw.map((s) => s.toLowerCase());
  const jobTitleTokens = new Set(tokenize(job.title));

  // Skills overlap (60 pts)
  let skillsPts = 0;
  if (userSkills.length > 0) {
    const userSkillsLower = userSkills.map((s) => s.toLowerCase());
    let matched = 0;
    for (const us of userSkillsLower) {
      if (!us) continue;
      const hit = jobSkillsLower.some((js) => js.includes(us) || us.includes(js)) ||
        jobTitleTokens.has(us);
      if (hit) matched++;
    }
    skillsPts = Math.round((matched / userSkillsLower.length) * 60);
  }

  // Title relevance (30 pts)
  let titlePts = 0;
  if (userTitle) {
    const userTitleTokens = tokenize(userTitle);
    const overlap = userTitleTokens.filter((t) => jobTitleTokens.has(t)).length;
    if (overlap >= 2) titlePts = 30;
    else if (overlap === 1) titlePts = 15;
  }

  // Experience (10 pts default, deduct on obvious mismatch)
  let expPts = 10;
  if (job.experience_level) {
    const lvl = job.experience_level.toLowerCase();
    const isJuniorUser = userSkills.length <= 1;
    if (isJuniorUser && (lvl.includes("lead") || lvl.includes("senior") || lvl.includes("principal"))) {
      expPts = 5;
    }
  }

  let score = skillsPts + titlePts + expPts;
  if (!isPro) score = Math.min(score, 95);
  return Math.max(0, Math.min(100, score));
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return NextResponse.json({ scores: {} });

    let body: { jobIds?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const jobIdsRaw = Array.isArray(body.jobIds) ? body.jobIds : [];
    const jobIds = jobIdsRaw
      .filter((v): v is string => typeof v === "string" && UUID_RE.test(v))
      .slice(0, 50);

    if (jobIds.length === 0) return NextResponse.json({ scores: {} });

    const [dbUser, profile, jobs] = await Promise.all([
      prisma.users.findUnique({
        where: { id: user.id },
        select: { skills: true, position: true },
      }),
      prisma.user_profiles.findFirst({
        where: { user_id: user.id, is_default: true },
        select: { title: true, skills: true },
      }),
      prisma.jobs.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, title: true, skills: true, experience_level: true },
      }),
    ]);

    const profileSkillsRaw = profile?.skills;
    const userSkillsRaw = dbUser?.skills;
    const skillsSource = Array.isArray(profileSkillsRaw)
      ? profileSkillsRaw
      : Array.isArray(userSkillsRaw)
      ? userSkillsRaw
      : [];
    const userSkills: string[] = (skillsSource as unknown[])
      .map((s) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object" && "name" in s && typeof (s as { name: unknown }).name === "string") {
          return (s as { name: string }).name;
        }
        return "";
      })
      .filter((s) => s.length > 0);

    const userTitle = profile?.title?.trim() || dbUser?.position?.trim() || "";

    if (userSkills.length === 0 && !userTitle) {
      return NextResponse.json({ scores: {} });
    }

    const isPro = false;
    const scores: Record<string, number> = {};
    for (const job of jobs) {
      const s = computeScore(userSkills, userTitle, job, isPro);
      if (s !== null) scores[job.id] = s;
    }

    return NextResponse.json({ scores });
  } catch (error) {
    return handleApiError(error);
  }
}
