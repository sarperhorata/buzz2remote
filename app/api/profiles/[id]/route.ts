import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const profile = await prisma.user_profiles.findFirst({
      where: { id, user_id: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.user_profiles.findFirst({
      where: { id, user_id: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { profile_name, title, bio, skills, work_experience, education, certificates, resume_url, resume_text, is_default } = body;

    // If setting as default, unset others
    if (is_default) {
      await prisma.user_profiles.updateMany({
        where: { user_id: user.id, id: { not: id } },
        data: { is_default: false },
      });
    }

    const profile = await prisma.user_profiles.update({
      where: { id },
      data: {
        ...(profile_name !== undefined && { profile_name }),
        ...(title !== undefined && { title }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(work_experience !== undefined && { work_experience }),
        ...(education !== undefined && { education }),
        ...(certificates !== undefined && { certificates }),
        ...(resume_url !== undefined && { resume_url }),
        ...(resume_text !== undefined && { resume_text }),
        ...(is_default !== undefined && { is_default }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.user_profiles.findFirst({
      where: { id, user_id: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (existing.is_default) {
      return NextResponse.json({ error: "Cannot delete default profile. Set another profile as default first." }, { status: 400 });
    }

    await prisma.user_profiles.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
