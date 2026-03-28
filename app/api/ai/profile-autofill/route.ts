import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { cvText } = await request.json();

    if (!cvText) {
      return NextResponse.json({ error: "CV text is required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        {
          role: "system",
          content: `Extract structured profile data from the CV/resume text. Return a JSON object with:
- full_name (string)
- bio (string, 2-3 sentence professional summary)
- position (string, current or most recent job title)
- company (string, current or most recent company)
- location (string)
- skills (array of objects with "name" field)
- work_experience (array of objects with: title, company, start_date, end_date, description, is_current)
- education (array of objects with: school, degree, field, start_date, end_date)
Use null for unknown fields. Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: cvText.slice(0, 8000),
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const profile = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({ profile, userId: user.id });
  } catch (error) {
    return handleApiError(error);
  }
}
