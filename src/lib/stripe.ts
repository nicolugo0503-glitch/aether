import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
  appInfo: { name: "Aether", version: "0.1.0" },
});

export const PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER || "",
  GROWTH:  process.env.STRIPE_PRICE_GROWTH  || "",
  SCALE:   process.env.STRIPE_PRICE_SCALE   || "",
} as const;

export const PLAN_LIMITS = {
  FREE:    { monthlyRuns: 25,     agents: 1,   label: "Free",    price: "$0",    images: false },
  STARTER: { monthlyRuns: 500,    agents: 3,   label: "Starter", price: "$49",   images: true  },
  GROWTH:  { monthlyRuns: 5_000,  agents: 10,  label: "Growth",  price: "$149",  images: true  },
  SCALE:   { monthlyRuns: 50_000, agents: 100, label: "Scale",   price: "$499",  images: true  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function toPlanKey(plan: string): PlanKey {
  if (plan in PLAN_LIMITS) return plan as PlanKey;
  return "FREE";
}

export function priceIdToPlan(priceId?: string | null): PlanKey {
  if (!priceId) return "FREE";
  if (priceId === PRICE_IDS.STARTER) return "STARTER";
  if (priceId === PRICE_IDS.GROWTH)  return "GROWTH";
  if (priceId === PRICE_IDS.SCALE)   return "SCALE";
  return "FREE";
}
