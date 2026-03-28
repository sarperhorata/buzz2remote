import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { sendWelcomeEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed_password = await hash(password, 12);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        full_name: name,
        hashed_password,
        is_active: true,
        is_superuser: false,
        email_verified: false,
        auth_provider: "local",
        onboarding_completed: false,
        onboarding_step: 0,
      },
    });

    // Send welcome email (fire and forget)
    sendWelcomeEmail(email, name).catch(console.error);

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.full_name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
