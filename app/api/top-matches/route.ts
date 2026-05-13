import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getGroqClient, MODELS } from "@/lib/groq";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { hasActiveSubscription } from "@/lib/subscription-limits";

const STOPWORDS = new Set([
  "senior", "junior", "lead", "the", "a", "of", "and", "or", "to", "for",
  "in", "at", "on", "principal", "staff", "mid", "level", "i", "ii", "iii",
]);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function normalizeSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((s) => {
      if (typeof s === "string") return s;
      if (s && typeof s === "object" && "name" in s && typeof (s as { name: unknown }).name === "string") {
        return (s as { name: string }).name;
      }
      return "";
    })
    .filter((s) => s.length > 0);
}

function computeScore(
  userSkills: string[],
  userTitle: string,
  job: { title: string; skills: unknown; experience_level: string | null }
): number {
  const jobSkillsRaw: string[] = Array.isArray(job.skills)
    ? (job.skills as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const jobSkillsLower = jobSkillsRaw.map((s) => s.toLowerCase());
  const jobTitleTokens = new Set(tokenize(job.title));

  let skillsPts = 0;
  if (userSkills.length > 0) {
    const userSkillsLower = userSkills.map((s) => s.toLowerCase());
    let matched = 0;
    for (const us of userSkillsLower) {
      if (!us) continue;
      const hit = jobSkillsLower.some((js) => js.includes(us) || us.includes(js)) || jobTitleTokens.has(us);
      if (hit) matched++;
    }
    skillsPts = Math.round((matched / userSkillsLower.length) * 60);
  }

  let titlePts = 0;
  if (userTitle) {
    const userTitleTokens = tokenize(userTitle);
    const overlap = userTitleTokens.filter((t) => jobTitleTokens.has(t)).length;
    if (overlap >= 2) titlePts = 30;
    else if (overlap === 1) titlePts = 15;
  }

  let expPts = 10;
  if (job.experience_level) {
    const lvl = job.experience_level.toLowerCase();
    const isJuniorUser = userSkills.length <= 1;
    if (isJuniorUser && (lvl.includes("lead") || lvl.includes("senior") || lvl.includes("principal"))) {
      expPts = 5;
    }
  }

  return Math.max(0, Math.min(100, skillsPts + titlePts + expPts));
}

export interface TopMatch {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  remote_type: string | null;
  job_type: string | null;
  experience_level: string | null;
  skills: string[];
  score: number;
  strong_match_reason: string;
  concerns: string[];
}

interface Explanation {
  jobIndex: number;
  strong_match_reason: string;
  concerns: string[];
}

async function generateExplanations(
  userTitle: string,
  userBio: string,
  userSkills: string[],
  jobs: Array<{ title: string; company: string; skills: string[] }>
): Promise<Explanation[]> {
  if (jobs.length === 0) return [];

  const client = getGroqClient();
  const jobLines = jobs
    .map(
      (j, i) =>
        `${i + 1}. ${j.title} @ ${j.company} — skills: ${j.skills.join(", ") || "N/A"}`
    )
    .join("\n");

  const systemPrompt =
    "You are a career strategist who explains why specific jobs match (or don't) a candidate's profile. Be concrete: cite the candidate's actual skills and experience. Return ONLY valid JSON.";

  const userPrompt = `Candidate profile:
- Title: ${userTitle || "N/A"}
- Skills: ${userSkills.join(", ") || "N/A"}
- Bio: ${userBio.slice(0, 500) || "N/A"}

Jobs they matched well with:
${jobLines}

For each job, write:
- "strong_match_reason": 2-3 sentences explaining why this role specifically fits their background (cite their skills/experience).
- "concerns": array of 1-2 short strings flagging potential gaps or things to clarify (or empty array).

Return JSON: { "explanations": [{ "jobIndex": 1, "strong_match_reason": "...", "concerns": ["..."] }, ...] }`;

  const completion = await client.chat.completions.create({
    model: MODELS.powerful,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2200,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    const raw = Array.isArray(parsed.explanations) ? parsed.explanations : [];
    return raw.map((e: unknown) => {
      const obj = (e ?? {}) as Record<string, unknown>;
      return {
        jobIndex: typeof obj.jobIndex === "number" ? obj.jobIndex : 0,
        strong_match_reason: typeof obj.strong_match_reason === "string" ? obj.strong_match_reason : "",
        concerns: Array.isArray(obj.concerns)
          ? (obj.concerns as unknown[]).filter((c): c is string => typeof c === "string")
          : [],
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        skills: true,
        position: true,
        bio: true,
        subscription_status: true,
        subscription_plan: true,
      },
    });

    const isPro = hasActiveSubscription(dbUser?.subscription_status);

    // Check cache (user_activities)
    const cached = await prisma.user_activities.findFirst({
      where: {
        user_id: user.id,
        activity_type: "top_matches_generated",
        timestamp: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { timestamp: "desc" },
    });

    if (cached?.details) {
      const details = cached.details as { matches?: TopMatch[]; generatedAt?: string; isPro?: boolean };
      if (details.matches && details.isPro === isPro) {
        return NextResponse.json({
          matches: details.matches,
          isPro,
          generatedAt: details.generatedAt || cached.timestamp.toISOString(),
          cached: true,
        });
      }
    }

    const profile = await prisma.user_profiles.findFirst({
      where: { user_id: user.id, is_default: true },
      select: { title: true, bio: true, skills: true, work_experience: true },
    });

    const userSkills = normalizeSkills(profile?.skills ?? dbUser?.skills);
    const userTitle = (profile?.title?.trim() || dbUser?.position?.trim() || "").trim();
    const userBio = (profile?.bio?.trim() || dbUser?.bio?.trim() || "").trim();

    if (userSkills.length === 0 && !userTitle) {
      return NextResponse.json({ matches: [], needsProfile: true, isPro });
    }

    // Fetch candidate jobs — narrow by first keyword of title first
    const titleTokens = tokenize(userTitle);
    const primaryKeyword = titleTokens[0];

    let candidates: Array<{
      id: string;
      title: string;
      company: string;
      location: string | null;
      salary: string | null;
      remote_type: string | null;
      job_type: string | null;
      experience_level: string | null;
      skills: unknown;
    }> = [];

    if (primaryKeyword) {
      candidates = await prisma.jobs.findMany({
        where: {
          is_active: true,
          archived: false,
          title: { contains: primaryKeyword, mode: "insensitive" },
        },
        orderBy: { posted_date: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          remote_type: true,
          job_type: true,
          experience_level: true,
          skills: true,
        },
      });
    }

    if (candidates.length < 10) {
      const broader = await prisma.jobs.findMany({
        where: {
          is_active: true,
          archived: false,
          id: { notIn: candidates.map((c) => c.id) },
        },
        orderBy: { posted_date: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          remote_type: true,
          job_type: true,
          experience_level: true,
          skills: true,
        },
      });
      candidates = [...candidates, ...broader];
    }

    if (candidates.length === 0) {
      return NextResponse.json({ matches: [], isPro });
    }

    // Score and pick top 8
    const scored = candidates
      .map((j) => ({
        job: j,
        score: computeScore(userSkills, userTitle, {
          title: j.title,
          skills: j.skills,
          experience_level: j.experience_level,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Build job summaries for AI
    const explainJobs = scored.map(({ job }) => ({
      title: job.title,
      company: job.company,
      skills: Array.isArray(job.skills)
        ? (job.skills as unknown[]).filter((s): s is string => typeof s === "string")
        : [],
    }));

    // For free users — only ask Groq for the first match
    const groqInput = isPro ? explainJobs : explainJobs.slice(0, 1);

    let explanations: Explanation[] = [];
    try {
      explanations = await generateExplanations(userTitle, userBio, userSkills, groqInput);
    } catch (e) {
      console.error("Top matches Groq error:", e);
      explanations = [];
    }

    const explByIndex = new Map<number, Explanation>();
    for (const e of explanations) {
      explByIndex.set(e.jobIndex, e);
    }

    const matches: TopMatch[] = scored.map(({ job, score }, i) => {
      const expl = explByIndex.get(i + 1);
      const skillsArr = Array.isArray(job.skills)
        ? (job.skills as unknown[]).filter((s): s is string => typeof s === "string")
        : [];

      // Free users: only first match gets explanations
      const includeExpl = isPro || i === 0;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        remote_type: job.remote_type,
        job_type: job.job_type,
        experience_level: job.experience_level,
        skills: skillsArr,
        score,
        strong_match_reason: includeExpl ? expl?.strong_match_reason || "" : "",
        concerns: includeExpl ? expl?.concerns || [] : [],
      };
    });

    const generatedAt = new Date().toISOString();

    // Cache result
    try {
      await prisma.user_activities.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          activity_type: "top_matches_generated",
          details: { matches, generatedAt, isPro } as object,
        },
      });
    } catch (e) {
      console.error("Failed to cache top matches:", e);
    }

    return NextResponse.json({ matches, isPro, generatedAt });
  } catch (error) {
    return handleApiError(error);
  }
}
