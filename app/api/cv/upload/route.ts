/**
 * POST /api/cv/upload
 *
 * One round-trip endpoint that powers /profile's Quick Import button and
 * /cv-review's drag-drop. Replaces the brittle ad-hoc PDF byte-regex parser
 * that used to live inline in /profile (would extract garbage from any
 * non-trivial CV).
 *
 * Flow:
 *   1. Multipart upload — file + optional flags (profileId, analyze, autofill).
 *   2. Server extracts real text via unpdf (PDFs) / mammoth (DOCX) / decoder (TXT).
 *   3. In parallel, we call:
 *        - profile-autofill (always) → structured fields for the profile form
 *        - cv-analysis (when ?analyze=1) → scores + suggestions for /cv-review
 *   4. Optionally persist the parsed fields + raw text to the named profile
 *      (when profileId is provided AND save=1).
 *
 * Why one endpoint instead of two:
 *   - User asked for "CV parse edip profili oluşturmak lazım hızlıca ve
 *     başvurularda kullanmak lazım. Ayrıca CV'yi de skorlamalıyız"
 *     → both happen on the same upload, and we want them to fire in
 *     parallel so total latency is max(parse, score) ≈ 8-12s, not sum.
 *   - The extracted text is non-trivial to compute (PDF parsing) so caching
 *     it across the two LLM calls in one request is a meaningful win.
 *
 * Auth: required. Anyone who can hit /profile or /cv-review.
 *
 * Runtime: nodejs (NOT edge) — unpdf and mammoth both need Node APIs and
 * are too big for the 1 MB edge function limit anyway.
 */

import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError, errorResponse } from "@/lib/api-utils";
import { extractCvText, CVExtractError, MAX_LLM_CHARS } from "@/lib/cv-extract";

export const runtime = "nodejs";
// Server-side PDF parsing + 2 LLM calls — comfortably under 30s but bump
// from the 10s default to be safe with cold-start + slow LLM responses.
export const maxDuration = 60;

const AUTOFILL_SYSTEM_PROMPT = `Extract structured profile data from the CV/resume text. Return a JSON object with these fields (use null when unknown — do not invent data):
- full_name (string)
- bio (string, 2-3 sentence professional summary written in third person)
- position (string, current or most recent job title)
- company (string, current or most recent company name)
- location (string, "City, Country" — extract from the header if present)
- email (string, only if explicitly in CV)
- phone (string, only if explicitly in CV)
- skills (array of strings — skill names only, deduplicate, normalize casing, max 30)
- work_experience (array of objects with: title, company, location, start_date, end_date, description, is_current; dates as "YYYY-MM" or year if month is unknown)
- education (array of objects with: school, degree, field, start_date, end_date)
- certificates (array of strings)
- languages (array of objects with: name, proficiency — e.g. "Native", "Fluent", "B2")
- links (object with possible keys: linkedin, github, portfolio, twitter — only set if URL present in CV)

Return ONLY valid JSON, no markdown.`;

const ANALYSIS_SYSTEM_PROMPT = `You are an expert CV/resume reviewer for remote tech roles. Analyze the CV and return a JSON object with:
- overall_score (0-100, holistic CV strength)
- ats_compatibility (0-100, machine-readable formatting, keyword density, standard sections)
- strengths (array of 3-6 specific things the CV does well)
- weaknesses (array of 3-6 specific weaknesses or red flags)
- suggestions (array of 4-8 actionable, specific rewrites/changes the candidate could make — concrete advice, not platitudes)
- keywords_missing (array of 5-15 high-value keywords likely missing for the candidate's apparent target role)
${"" /* job_match_score is added by the caller when jobTitle is provided */}

Be honest and specific. "Add metrics to your achievements" is generic; "Replace 'Led development team' with 'Led 8-person engineering team and shipped 4 quarterly releases that grew DAU 35%'" is useful.

Return ONLY valid JSON, no markdown.`;

interface AutofillResult {
  full_name?: string | null;
  bio?: string | null;
  position?: string | null;
  company?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  skills?: string[];
  work_experience?: unknown[];
  education?: unknown[];
  certificates?: string[];
  languages?: Array<{ name: string; proficiency?: string }>;
  links?: Record<string, string>;
}

interface AnalysisResult {
  overall_score?: number;
  ats_compatibility?: number;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  keywords_missing?: string[];
  job_match_score?: number;
}

async function runAutofill(cvText: string): Promise<AutofillResult> {
  const completion = await groq.chat.completions.create({
    model: MODELS.powerful,
    messages: [
      { role: "system", content: AUTOFILL_SYSTEM_PROMPT },
      { role: "user", content: cvText.slice(0, MAX_LLM_CHARS) },
    ],
    temperature: 0.2,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
}

async function runAnalysis(cvText: string, jobTitle?: string): Promise<AnalysisResult> {
  const sys = jobTitle
    ? `${ANALYSIS_SYSTEM_PROMPT}\n\nAlso include:\n- job_match_score (0-100, how well the CV matches the role "${jobTitle}")`
    : ANALYSIS_SYSTEM_PROMPT;

  const completion = await groq.chat.completions.create({
    model: MODELS.powerful,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Analyze this CV:\n\n${cvText.slice(0, MAX_LLM_CHARS)}` },
    ],
    temperature: 0.3,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse("No file provided. Send 'file' as multipart/form-data.", 400);
    }

    // ?profileId=... — when present and ?save=1, we PUT the parsed fields onto
    // that profile after extracting. We only save if both are set so /cv-review
    // (scoring-only) doesn't accidentally overwrite the user's profile.
    const profileId = (form.get("profileId") as string | null) ?? null;
    const save = form.get("save") === "1";
    const analyze = form.get("analyze") === "1";
    const autofill = form.get("autofill") !== "0"; // default true
    const jobTitle = (form.get("jobTitle") as string | null)?.trim() || undefined;

    // 1) Extract text — fails fast on garbage input.
    let cvText: string;
    let format: string;
    try {
      const out = await extractCvText(file);
      cvText = out.text;
      format = out.format;
    } catch (err) {
      if (err instanceof CVExtractError) {
        return errorResponse(err.message, err.code === "too_large" ? 413 : 400);
      }
      throw err;
    }

    // 2) Fire LLM calls in parallel. Either or both may be disabled by the
    // caller — we just need at least ONE useful output (or we return the
    // extracted text alone so the client can fall back gracefully).
    const tasks: Promise<unknown>[] = [];
    let autofillIdx = -1;
    let analysisIdx = -1;
    if (autofill) {
      autofillIdx = tasks.length;
      tasks.push(runAutofill(cvText).catch((e) => ({ __error: e instanceof Error ? e.message : "autofill failed" })));
    }
    if (analyze) {
      analysisIdx = tasks.length;
      tasks.push(runAnalysis(cvText, jobTitle).catch((e) => ({ __error: e instanceof Error ? e.message : "analysis failed" })));
    }
    const results = await Promise.all(tasks);

    const autofillResult = autofillIdx >= 0 ? (results[autofillIdx] as AutofillResult) : null;
    const analysisResult = analysisIdx >= 0 ? (results[analysisIdx] as AnalysisResult) : null;

    // 3) Optionally persist to the user's profile. We do this here (vs.
    // making the client follow up with a PUT) so the save survives even if
    // the user navigates away mid-edit. The parsed fields populate the form
    // for review, but the DB is the source of truth.
    let savedProfileId: string | null = null;
    if (save && profileId && autofillResult && !("__error" in autofillResult)) {
      const existing = await prisma.user_profiles.findFirst({
        where: { id: profileId, user_id: user.id },
      });
      if (existing) {
        // Map the LLM's skills (strings) to the {name: string}[] shape the
        // profile form expects. Merge with existing skills so we don't lose
        // user-added entries on re-import.
        const existingSkills = Array.isArray(existing.skills)
          ? (existing.skills as Array<{ name?: string } | string>).map((s) =>
              typeof s === "string" ? s : s?.name ?? ""
            ).filter(Boolean)
          : [];
        const incomingSkills = Array.isArray(autofillResult.skills) ? autofillResult.skills : [];
        const mergedSkills = Array.from(new Set([...existingSkills, ...incomingSkills]))
          .filter(Boolean)
          .map((name) => ({ name }));

        await prisma.user_profiles.update({
          where: { id: profileId },
          data: {
            title: autofillResult.position ?? existing.title,
            bio: autofillResult.bio ?? existing.bio,
            skills: mergedSkills,
            work_experience: (autofillResult.work_experience ?? existing.work_experience) as never,
            education: (autofillResult.education ?? existing.education) as never,
            certificates: (autofillResult.certificates ?? existing.certificates) as never,
            resume_text: cvText,
            updated_at: new Date(),
          },
        });
        savedProfileId = profileId;
      }
    }

    return NextResponse.json({
      ok: true,
      format,
      text_length: cvText.length,
      // Convenient: a short preview so the client can show "we read XYZ from
      // your CV" without having to send the whole thing back to the user.
      text_preview: cvText.slice(0, 280),
      profile: autofillResult,
      analysis: analysisResult,
      saved_profile_id: savedProfileId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
