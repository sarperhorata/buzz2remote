import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/api-utils";

const PLANS: Record<string, { priceId: string; name: string }> = {
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro", name: "Pro" },
  premium: { priceId: process.env.STRIPE_PREMIUM_PRICE_ID || "price_premium", name: "Premium" },
};

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { plan } = await request.json();

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { email: true, stripe_customer_id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = dbUser.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.users.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
