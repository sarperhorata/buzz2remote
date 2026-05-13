import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

interface OnboardingBody {
  step: number;
  position?: string;
  location?: string;
  bio?: string;
  skills?: string[];
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: OnboardingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { step, position, location, bio, skills } = body;

  if (typeof step !== "number" || step < 1 || step > 3) {
    return NextResponse.json(
      { error: "step must be a number between 1 and 3" },
      { status: 400 }
    );
  }

  // Build the update payload — only write defined fields
  const updateData: Record<string, unknown> = {
    onboarding_step: step,
    updated_at: new Date(),
  };

  if (step === 3) {
    updateData.onboarding_completed = true;
  }

  if (position !== undefined) updateData.position = position;
  if (location !== undefined) updateData.location = location;
  if (bio !== undefined) updateData.bio = bio;

  // Skills are stored as JSON array of objects: [{name: "React"}, ...]
  if (Array.isArray(skills)) {
    updateData.skills = skills.map((name: string) => ({ name }));
  }

  await prisma.users.update({
    where: { id: user!.id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
