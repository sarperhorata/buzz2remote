import { getGroqClient, MODELS } from "@/lib/groq";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    // Fetch user from DB
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        skills: true,
        work_experience: true,
        position: true,
        bio: true,
        subscription_plan: true,
      },
    });

    // Fetch default profile
    const profile = await prisma.user_profiles.findFirst({
      where: { user_id: user.id, is_default: true },
      select: {
        title: true,
        skills: true,
        work_experience: true,
        resume_text: true,
      },
    });

    // Count applications
    const applicationCount = await prisma.user_applications.count({
      where: { user_id: user.id },
    });

    const profileData = {
      position: dbUser?.position ?? null,
      bio: dbUser?.bio ?? null,
      subscription_plan: dbUser?.subscription_plan ?? "free",
      user_skills: dbUser?.skills ?? null,
      user_work_experience: dbUser?.work_experience ?? null,
      profile_title: profile?.title ?? null,
      profile_skills: profile?.skills ?? null,
      profile_work_experience: profile?.work_experience ?? null,
      resume_text: profile?.resume_text ?? null,
      total_applications: applicationCount,
    };

    const systemPrompt = `You are a senior career strategist specializing in remote work and tech careers.
Analyze the candidate's profile and provide a comprehensive career diagnosis.
Return a JSON object with:
- overall_score (0-100): overall career readiness score
- profile_strength (0-100): how strong their profile is
- readiness_level: "beginner" | "developing" | "competitive" | "strong" | "exceptional"
- strengths: string[] (3-5 specific strengths)
- gaps: string[] (3-5 specific gaps to address)
- quick_wins: string[] (3 actions they can take THIS WEEK to improve)
- long_term_actions: string[] (3 strategic 3-6 month goals)
- remote_readiness (0-100): how ready they are specifically for remote work
- top_job_categories: string[] (top 3 job categories that best fit their profile)
- salary_range: { min: number, max: number, currency: "USD" } (estimated based on their profile)
Return ONLY valid JSON, no markdown.`;

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this candidate profile:\n\n${JSON.stringify(profileData, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const diagnosis = JSON.parse(completion.choices[0].message.content || "{}");

    return Response.json({ diagnosis });
  } catch (error) {
    return handleApiError(error);
  }
}
