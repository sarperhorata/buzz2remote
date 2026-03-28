import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { title, company, description, salary, applyUrl } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        {
          role: "system",
          content: `You are a fraud detection expert for job postings. Analyze the job posting for red flags.
Return a JSON object with:
- is_suspicious (boolean)
- confidence (0-100)
- risk_level ("low" | "medium" | "high")
- red_flags (array of strings describing specific concerns)
- positive_signals (array of strings describing legitimate indicators)
- recommendation (string with advice for the job seeker)
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Analyze this job posting:\n- Title: ${title}\n- Company: ${company || "Not specified"}\n- Salary: ${salary || "Not specified"}\n- Apply URL: ${applyUrl || "Not specified"}\n- Description: ${description.slice(0, 4000)}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({ analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
