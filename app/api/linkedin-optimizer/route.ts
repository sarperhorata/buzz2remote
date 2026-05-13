import { getGroqClient, MODELS } from "@/lib/groq";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    // Fetch default profile
    const profile = await prisma.user_profiles.findFirst({
      where: { user_id: user.id, is_default: true },
      select: {
        title: true,
        bio: true,
        skills: true,
        work_experience: true,
      },
    });

    const profileData = {
      title: profile?.title ?? null,
      bio: profile?.bio ?? null,
      skills: profile?.skills ?? null,
      work_experience: profile?.work_experience ?? null,
    };

    const systemPrompt = `You are a LinkedIn profile expert specialized in remote work and tech profiles.
Analyze the candidate's profile and return LinkedIn optimization advice.
Return JSON with:
- headline_suggestions: string[] (3 LinkedIn headline options, max 220 chars each)
- about_section_tips: string[] (5 specific tips for their About section)
- skills_to_add: string[] (10 LinkedIn skills they should add based on their experience)
- profile_completeness_tips: string[] (5 actions to improve profile completeness)
- content_strategy: string[] (3 content ideas they could post to build their personal brand)
- quick_fixes: string[] (3 things they can fix right now in <5 minutes)
Return ONLY valid JSON.`;

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: MODELS.powerful,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Optimize LinkedIn profile for this candidate:\n\n${JSON.stringify(profileData, null, 2)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const optimization = JSON.parse(completion.choices[0].message.content || "{}");

    return Response.json({ optimization });
  } catch (error) {
    return handleApiError(error);
  }
}
