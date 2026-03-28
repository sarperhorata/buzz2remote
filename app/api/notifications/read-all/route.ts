import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function PUT() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    await prisma.user_notifications.updateMany({
      where: { user_id: user.id, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
