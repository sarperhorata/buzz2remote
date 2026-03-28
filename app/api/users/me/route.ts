import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";
import { userUpdateSchema } from "@/lib/validators/user";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        username: true,
        bio: true,
        company: true,
        position: true,
        location: true,
        profile_picture_url: true,
        resume_url: true,
        skills: true,
        work_experience: true,
        education: true,
        certificates: true,
        social_links: true,
        auth_provider: true,
        is_superuser: true,
        email_verified: true,
        onboarding_completed: true,
        onboarding_step: true,
        subscription_status: true,
        subscription_plan: true,
        subscription_end_date: true,
        created_at: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data: Prisma.usersUpdateInput = { updated_at: new Date() };

    if (parsed.data.full_name) data.full_name = parsed.data.full_name;
    if (parsed.data.username) data.username = parsed.data.username;
    if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
    if (parsed.data.company !== undefined) data.company = parsed.data.company;
    if (parsed.data.position !== undefined) data.position = parsed.data.position;
    if (parsed.data.location !== undefined) data.location = parsed.data.location;
    if (parsed.data.profile_picture_url) data.profile_picture_url = parsed.data.profile_picture_url;
    if (parsed.data.skills) data.skills = parsed.data.skills as Prisma.InputJsonValue;
    if (parsed.data.work_experience) data.work_experience = parsed.data.work_experience as Prisma.InputJsonValue;
    if (parsed.data.education) data.education = parsed.data.education as Prisma.InputJsonValue;
    if (parsed.data.social_links) data.social_links = parsed.data.social_links as Prisma.InputJsonValue;

    const updated = await prisma.users.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      message: "Profile updated",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
