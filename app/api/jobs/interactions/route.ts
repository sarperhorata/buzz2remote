import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const rows = await prisma.job_interactions.findMany({
      where: {
        user_id: user.id,
        interaction_type: { in: ["like", "dismiss"] },
      },
      select: { job_id: true, interaction_type: true },
    });

    const likes: string[] = [];
    const dismisses: string[] = [];
    for (const r of rows) {
      if (r.interaction_type === "like") likes.push(r.job_id);
      else if (r.interaction_type === "dismiss") dismisses.push(r.job_id);
    }

    return NextResponse.json({ likes, dismisses });
  } catch (error) {
    return handleApiError(error);
  }
}
