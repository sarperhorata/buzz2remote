import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await prisma.users.update({
          where: { id: userId },
          data: {
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
            subscription_plan: plan,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const userId = (customer as { metadata?: { userId?: string } }).metadata?.userId;

      if (userId) {
        await prisma.users.update({
          where: { id: userId },
          data: {
            subscription_status: subscription.status,
            subscription_end_date: new Date(
              ((subscription as unknown as Record<string, number>).current_period_end ?? 0) * 1000
            ),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const userId = (customer as { metadata?: { userId?: string } }).metadata?.userId;

      if (userId) {
        await prisma.users.update({
          where: { id: userId },
          data: {
            subscription_status: "canceled",
            subscription_plan: null,
            stripe_subscription_id: null,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
