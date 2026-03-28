import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { cvText, jobTitle } = await request.json();

    if (!cvText) {
      return NextResponse.json({ error: "CV text is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert CV/resume analyst. Analyze the provided CV and give actionable feedback.
Return a JSON object with:
- overall_score (0-100)
- strengths (array of strings)
- weaknesses (array of strings)
- suggestions (array of strings with specific improvements)
- keywords_missing (array of relevant keywords not found in the CV)
- ats_compatibility (0-100, how well it would pass ATS systems)
${jobTitle ? `- job_match_score (0-100, how well the CV matches the "${jobTitle}" role)` : ""}
Return ONLY valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this CV:\n\n${cvText.slice(0, 8000)}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({ analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
