import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [
        {
          role: "system",
          content: `Extract technical and professional skills from the text. Return a JSON object with:
- technical_skills (array of strings: programming languages, frameworks, tools)
- soft_skills (array of strings: communication, leadership, etc.)
- certifications (array of strings: any mentioned certifications)
- languages (array of strings: spoken/written languages)
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: text.slice(0, 5000),
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const skills = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({ skills });
  } catch (error) {
    return handleApiError(error);
  }
}
