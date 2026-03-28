import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, location, experienceYears, skills } = await request.json();

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        {
          role: "system",
          content: `You are a salary estimation expert for remote jobs. Based on job details, provide salary estimates in USD.
Return a JSON object with:
- salary_min (number, annual USD)
- salary_max (number, annual USD)
- median (number, annual USD)
- currency: "USD"
- confidence (0-100)
- factors (array of strings explaining what influences the salary)
- market_trend ("rising" | "stable" | "declining")
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Estimate salary for:\n- Title: ${jobTitle}\n- Location: ${location || "Remote/Worldwide"}\n- Experience: ${experienceYears || "Not specified"} years\n- Skills: ${skills || "Not specified"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const estimation = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({ estimation });
  } catch (error) {
    return handleApiError(error);
  }
}
