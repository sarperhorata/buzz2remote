import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email: parsed.data.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate reset token (store in user profile JSON)
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.users.update({
      where: { id: user.id },
      data: {
        profile: {
          ...(user.profile as Record<string, unknown> ?? {}),
          resetToken: token,
          resetTokenExpires: expires.toISOString(),
        },
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
