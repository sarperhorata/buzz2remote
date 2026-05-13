/**
 * End-to-end test for the CV upload pipeline.
 *
 * Bypasses the HTTP layer (which would need a session cookie) and exercises
 * the underlying lib + LLM calls directly:
 *   1. Read Sarper PM.pdf from disk
 *   2. Extract text via lib/cv-extract
 *   3. Run BOTH profile-autofill and cv-analysis prompts in parallel, exactly
 *      as /api/cv/upload does
 *   4. Print compact summaries so we can spot junk output (empty arrays,
 *      hallucinated names, etc.)
 *
 * Usage: npx tsx scripts/test-cv-upload-pipeline.ts "/Users/sarperhorata/Desktop/Sarper PM.pdf"
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { config } from "dotenv";
import { extractCvText } from "../lib/cv-extract";

// Load .env.local so GROQ_API_KEY_* are available outside of Next.js.
config({ path: ".env.local" });
config({ path: ".env" });

// We can't import from /api routes directly (they pull in the auth + db
// machinery), so re-declare the prompts here. Keep these in sync with
// app/api/cv/upload/route.ts.
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

Be honest and specific. "Add metrics to your achievements" is generic; "Replace 'Led development team' with 'Led 8-person engineering team and shipped 4 quarterly releases that grew DAU 35%'" is useful.

Return ONLY valid JSON, no markdown.`;

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: tsx scripts/test-cv-upload-pipeline.ts <path-to-cv>");
    process.exit(1);
  }

  // Load Groq lazily so the dotenv calls above have a chance to populate env.
  const { groq, MODELS } = await import("../lib/groq");

  const buf = readFileSync(path);
  const name = basename(path);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const type =
    ext === "pdf" ? "application/pdf" :
    ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
    ext === "txt" ? "text/plain" : "";

  const file = {
    size: buf.byteLength,
    name,
    type,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  };

  console.log(`[1] Extracting text from ${name}…`);
  const t0 = Date.now();
  const { text, format } = await extractCvText(file);
  console.log(`    OK in ${Date.now() - t0}ms — ${text.length} chars, format=${format}\n`);

  console.log(`[2] Calling profile-autofill + cv-analysis in parallel via Groq…`);
  const t1 = Date.now();
  const [autofill, analysis] = await Promise.all([
    groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        { role: "system", content: AUTOFILL_SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 16_000) },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    }),
    groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `Analyze this CV:\n\n${text.slice(0, 16_000)}` },
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    }),
  ]);
  console.log(`    OK in ${Date.now() - t1}ms\n`);

  const profile = JSON.parse(autofill.choices[0]?.message?.content ?? "{}");
  const review = JSON.parse(analysis.choices[0]?.message?.content ?? "{}");

  console.log(`[3] PROFILE AUTOFILL — parsed fields:`);
  console.log(`    full_name:   ${profile.full_name}`);
  console.log(`    position:    ${profile.position}`);
  console.log(`    company:     ${profile.company}`);
  console.log(`    location:    ${profile.location}`);
  console.log(`    email:       ${profile.email}`);
  console.log(`    bio:         ${(profile.bio ?? "").slice(0, 120)}${(profile.bio ?? "").length > 120 ? "…" : ""}`);
  console.log(`    skills:      ${(profile.skills ?? []).length} → ${(profile.skills ?? []).slice(0, 8).join(", ")}…`);
  console.log(`    experience:  ${(profile.work_experience ?? []).length} entries`);
  if (profile.work_experience?.[0]) {
    const w = profile.work_experience[0];
    console.log(`                 [0] ${w.title} @ ${w.company} (${w.start_date} – ${w.end_date}, current=${w.is_current})`);
  }
  console.log(`    education:   ${(profile.education ?? []).length} entries`);
  if (profile.education?.[0]) {
    const e = profile.education[0];
    console.log(`                 [0] ${e.school}, ${e.degree} ${e.field || ""}`);
  }
  console.log(`    languages:   ${(profile.languages ?? []).map((l: { name: string; proficiency?: string }) => `${l.name}(${l.proficiency || "?"})`).join(", ")}`);
  console.log();

  console.log(`[4] CV ANALYSIS — scores:`);
  console.log(`    overall:           ${review.overall_score}`);
  console.log(`    ats_compatibility: ${review.ats_compatibility}`);
  console.log(`    strengths:    ${review.strengths?.length || 0} items`);
  if (review.strengths?.length) {
    console.log(`                  • ${review.strengths.slice(0, 2).join("\n                  • ")}`);
  }
  console.log(`    weaknesses:   ${review.weaknesses?.length || 0} items`);
  if (review.weaknesses?.length) {
    console.log(`                  • ${review.weaknesses.slice(0, 2).join("\n                  • ")}`);
  }
  console.log(`    suggestions:  ${review.suggestions?.length || 0} items`);
  if (review.suggestions?.length) {
    console.log(`                  1. ${review.suggestions[0]}`);
    if (review.suggestions[1]) console.log(`                  2. ${review.suggestions[1]}`);
  }
  console.log(`    missing kws:  ${(review.keywords_missing ?? []).slice(0, 10).join(", ")}`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
