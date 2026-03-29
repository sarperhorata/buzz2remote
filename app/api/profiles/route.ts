import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { canCreateProfile } from "@/lib/subscription-limits";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const profiles = await prisma.user_profiles.findMany({
      where: { user_id: user.id },
      orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    // Get user's subscription plan
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { subscription_plan: true },
    });

    // Check limit
    const check = await canCreateProfile(user.id, dbUser?.subscription_plan);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: `Profile limit reached (${check.current}/${check.limit}). Upgrade your plan to create more profiles.`,
          limit: check.limit,
          current: check.current,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { profile_name, title, bio, skills, work_experience, education, certificates, resume_url, resume_text } = body;

    if (!profile_name) {
      return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
    }

    // First profile is always default
    const isFirst = check.current === 0;

    const profile = await prisma.user_profiles.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        profile_name,
        is_default: isFirst,
        title: title || null,
        bio: bio || null,
        skills: skills || null,
        work_experience: work_experience || null,
        education: education || null,
        certificates: certificates || null,
        resume_url: resume_url || null,
        resume_text: resume_text || null,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
