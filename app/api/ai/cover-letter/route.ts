import { NextRequest, NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { jobId, tone } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const [job, dbUser] = await Promise.all([
      prisma.jobs.findUnique({ where: { id: jobId } }),
      prisma.users.findUnique({
        where: { id: user.id },
        select: { full_name: true, skills: true, work_experience: true, bio: true, position: true },
      }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const userSkills = Array.isArray(dbUser?.skills)
      ? (dbUser.skills as Array<{ name: string }>).map((s) => s.name).join(", ")
      : "";

    const completion = await groq.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        {
          role: "system",
          content: `You are an expert cover letter writer. Write a compelling, personalized cover letter.
Tone: ${tone || "professional"}
Keep it concise (250-350 words). Focus on how the candidate's experience matches the role.
Return a JSON object with:
- cover_letter (string, the full cover letter text)
- key_points (array of 3-4 main selling points highlighted)
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Write a cover letter for:\n\nJob: ${job.title} at ${job.company}\nDescription: ${job.description?.slice(0, 2000) || "N/A"}\nRequirements: ${job.requirements?.slice(0, 1000) || "N/A"}\n\nCandidate:\n- Name: ${dbUser?.full_name || "Candidate"}\n- Current Role: ${dbUser?.position || "N/A"}\n- Skills: ${userSkills || "N/A"}\n- Bio: ${dbUser?.bio?.slice(0, 500) || "N/A"}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
