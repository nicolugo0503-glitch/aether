import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const plan = String(form.get("plan") || "STARTER") as "STARTER" | "GROWTH" | "SCALE";
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=missing_price", req.url),
    );
  }

  // Ensure a Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?error=cancelled`,
    allow_promotion_codes: true,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
