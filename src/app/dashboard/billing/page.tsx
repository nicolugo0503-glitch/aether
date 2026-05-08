import { getCurrentUser } from "@/lib/auth";
import { PLAN_LIMITS, toPlanKey, stripe, priceIdToPlan } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, Zap, Bot, Sparkles } from "lucide-react";

const TIERS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "$49",
    desc: "Perfect for solo operators",
    color: "#7c3aed",
    features: ["3 AI employees", "500 runs/month", "Email campaigns", "Social posting"],
  },
  {
    key: "GROWTH" as const,
    name: "Growth",
    price: "$149",
    desc: "For growing teams",
    color: "#0ea5e9",
    features: ["10 AI employees", "2,000 runs/month", "Advanced analytics", "Priority support"],
    badge: "Popular",
  },
  {
    key: "SCALE" as const,
    name: "Scale",
    price: "$499",
    desc: "For serious operators",
    color: "#10b981",
    features: ["Unlimited employees", "10,000 runs/month", "Custom integrations", "Dedicated support"],
  },
] as const;

export default async function BillingPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; success?: string; session_id?: string }> }) {
  const user = (await getCurrentUser())!;
  const { error, success, session_id } = await searchParams;

  if (success && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
      if (session.payment_status === "paid" && session.metadata?.userId === user.id) {
        const sub = session.subscription as import("stripe").Stripe.Subscription;
        const priceId = sub?.items?.data[0]?.price?.id;
        const newPlan = priceIdToPlan(priceId);
        if (newPlan !== "FREE") {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: newPlan, stripeSubscriptionId: sub.id, planRenewsAt: new Date(sub.current_period_end * 1000), runsUsedThisPeriod: 0 },
          });
          redirect("/dashboard/billing?success=1");
        }
      }
    } catch (e) { console.error("[billing] session confirm error", e); }
  }

  const limits = PLAN_LIMITS[toPlanKey(user.plan)];
  const usedPct = Math.min(100, (user.runsUsedThisPeriod / limits.monthlyRuns) * 100);

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes tier-enter{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .tier-card{animation:tier-enter 0.4s ease both}
        .tier-card:nth-child(1){animation-delay:0.05s}.tier-card:nth-child(2){animation-delay:0.1s}.tier-card:nth-child(3){animation-delay:0.15s}
        .upgrade-btn:hover{filter:brightness(1.15)}
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
          <CreditCard style={{ width:18, height:18 }} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Billing</h1>
          <p className="text-sm text-zinc-500">
            {user.plan} plan{user.planRenewsAt && ` · renews ${user.planRenewsAt.toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {/* ── Banners ── */}
      {error === "run_limit" && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-red-400 font-semibold text-sm">🚫 Run limit reached — upgrade to keep going.</span>
        </div>
      )}
      {error === "agent_limit" && (
        <div className="rounded-2xl px-5 py-4"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-red-400 font-semibold text-sm">🚫 Agent limit reached — upgrade to hire more.</span>
        </div>
      )}
      {success && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold text-sm">Payment successful — welcome to the next tier. 🚀</span>
        </div>
      )}

      {/* ── Usage Card ── */}
      <div className="rounded-3xl p-6"
        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-400" />Usage this period
          </h2>
          <span className="text-xs text-zinc-600 uppercase tracking-widest">{user.plan}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl p-4" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs text-zinc-600 mb-1.5 uppercase tracking-widest">Runs Used</div>
            <div className="text-2xl font-black text-white tabular-nums">{user.runsUsedThisPeriod.toLocaleString()}</div>
            <div className="text-xs text-zinc-600 mt-0.5">of {limits.monthlyRuns.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs text-zinc-600 mb-1.5 uppercase tracking-widest">Agents Allowed</div>
            <div className="text-2xl font-black text-white tabular-nums">{limits.agents}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Bot className="h-3 w-3 text-violet-400" />
              <span className="text-xs text-zinc-600">employees</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
            <span>Run usage</span>
            <span>{Math.round(usedPct)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{
              width:`${usedPct}%`,
              background: usedPct > 90 ? "linear-gradient(90deg,#ef4444,#f97316)"
                : usedPct > 70 ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                : "linear-gradient(90deg,#7c3aed,#6d28d9)",
            }} />
          </div>
        </div>
      </div>

      {/* ── Tier Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const isCurrent = user.plan === t.key;
          const planLimits = PLAN_LIMITS[t.key];
          return (
            <div key={t.key} className="tier-card relative rounded-3xl overflow-hidden transition-all"
              style={{
                background: isCurrent ? `linear-gradient(135deg,${t.color}0d,rgba(4,4,8,0.95))` : "rgba(255,255,255,0.02)",
                border: isCurrent ? `1px solid ${t.color}50` : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isCurrent ? `0 0 40px ${t.color}18` : "none",
              }}>
              {t.badge && !isCurrent && (
                <div className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background:`${t.color}20`, color:t.color, border:`1px solid ${t.color}40` }}>
                  {t.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background:`${t.color}20`, color:t.color, border:`1px solid ${t.color}40` }}>
                  <CheckCircle2 className="h-3 w-3" />Current
                </div>
              )}

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{t.price}</span>
                    <span className="text-zinc-600 text-sm">/mo</span>
                  </div>
                  <div className="text-base font-bold text-white mt-0.5">{t.name}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{t.desc}</div>
                </div>

                <ul className="space-y-2 mb-6">
                  {t.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color:t.color }} />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <Zap className="h-3.5 w-3.5 shrink-0" style={{ color:t.color }} />
                    {planLimits.monthlyRuns.toLocaleString()} runs / mo
                  </li>
                </ul>

                {isCurrent ? (
                  <form action="/api/stripe/portal" method="POST">
                    <button type="submit"
                      className="w-full rounded-xl py-2.5 text-sm font-semibold text-zinc-400 transition-all hover:text-white"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                      Manage subscription
                    </button>
                  </form>
                ) : (
                  <form action="/api/stripe/checkout" method="POST">
                    <input type="hidden" name="plan" value={t.key} />
                    <button type="submit"
                      className="upgrade-btn w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all"
                      style={{ background:`linear-gradient(135deg,${t.color},${t.color}aa)`, boxShadow:`0 0 20px ${t.color}30` }}>
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />Upgrade to {t.name}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
