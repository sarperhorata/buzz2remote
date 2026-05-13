import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { createMobileToken, handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        full_name: true,
        hashed_password: true,
        is_active: true,
        is_superuser: true,
        profile_picture_url: true,
        subscription_plan: true,
      },
    });

    if (!user || !user.hashed_password || !user.is_active) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await compare(password, user.hashed_password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createMobileToken({
      userId: user.id,
      email: user.email,
      name: user.full_name || "",
      isAdmin: user.is_superuser,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        image: user.profile_picture_url,
        subscriptionPlan: user.subscription_plan || "free",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
