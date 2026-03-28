import { NextResponse } from "next/server";
import { groq, MODELS } from "@/lib/groq";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    // Get user profile
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { skills: true, work_experience: true, position: true, bio: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSkills = Array.isArray(dbUser.skills)
      ? (dbUser.skills as Array<{ name: string }>).map((s) => s.name).join(", ")
      : "";

    // Get recent active jobs
    const recentJobs = await prisma.jobs.findMany({
      where: { is_active: true, archived: false },
      orderBy: { posted_date: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        skills: true,
        salary_min: true,
        salary_max: true,
        job_type: true,
        description: true,
      },
    });

    if (recentJobs.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const jobSummaries = recentJobs.map((j, i) =>
      `[${i}] ${j.title} at ${j.company} | Skills: ${Array.isArray(j.skills) ? (j.skills as string[]).join(", ") : "N/A"}`
    ).join("\n");

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [
        {
          role: "system",
          content: `You are a job matching expert. Given a user's profile and a list of jobs, return the indices of the top 10 best matching jobs as a JSON array of numbers. Consider skill overlap, experience relevance, and career progression. Return ONLY a JSON array like [0, 5, 12, ...].`,
        },
        {
          role: "user",
          content: `User Profile:\n- Position: ${dbUser.position || "N/A"}\n- Skills: ${userSkills || "N/A"}\n- Bio: ${dbUser.bio?.slice(0, 500) || "N/A"}\n\nAvailable Jobs:\n${jobSummaries}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    let indices: number[] = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content || "[]");
      indices = Array.isArray(parsed) ? parsed : (parsed.indices || parsed.jobs || []);
    } catch {
      indices = [];
    }

    const recommendations = indices
      .filter((i) => i >= 0 && i < recentJobs.length)
      .slice(0, 10)
      .map((i) => recentJobs[i]);

    return NextResponse.json({ recommendations });
  } catch (error) {
    return handleApiError(error);
  }
}
