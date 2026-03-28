import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const [notifications, unreadCount] = await Promise.all([
      prisma.user_notifications.findMany({
        where: { user_id: user.id, is_active: true },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
      prisma.user_notifications.count({
        where: { user_id: user.id, is_active: true, is_read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
