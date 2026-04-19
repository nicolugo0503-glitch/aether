import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, priceIdToPlan } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Stripe requires the raw body for signature verification.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string | null;
        if (!userId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceIdToPlan(priceId);

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            plan,
            planRenewsAt: new Date(sub.current_period_end * 1000),
            runsUsedThisPeriod: 0,
          },
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceIdToPlan(priceId);
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan,
            planRenewsAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // Reset the usage window on successful renewal.
        if (invoice.subscription) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { runsUsedThisPeriod: 0 },
          });
        }
        break;
      }
    }
  } catch (e: any) {
    console.error("stripe webhook handler error", e);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
