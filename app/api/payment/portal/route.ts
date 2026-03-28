import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

export async function POST() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { stripe_customer_id: true },
    });

    if (!dbUser?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
