import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators/auth";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Find user with matching reset token
    const users = await prisma.$queryRaw<
      Array<{ id: string; profile: Record<string, unknown> }>
    >`
      SELECT id, profile FROM users
      WHERE profile->>'resetToken' = ${token}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = users[0];
    const tokenExpires = user.profile?.resetTokenExpires as string;

    if (!tokenExpires || new Date(tokenExpires) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    const hashed_password = await hash(password, 12);

    // Update password and clear reset token
    const { resetToken: _, resetTokenExpires: __, ...cleanProfile } =
      user.profile ?? {};

    await prisma.users.update({
      where: { id: user.id },
      data: {
        hashed_password,
        profile: cleanProfile as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
