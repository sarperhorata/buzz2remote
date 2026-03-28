import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    await prisma.user_notifications.updateMany({
      where: { id, user_id: user.id },
      data: { is_read: true, read_at: new Date() },
    });

    return NextResponse.json({ message: "Marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
