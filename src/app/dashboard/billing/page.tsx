import { getCurrentUser } from "@/lib/auth";
import { PLAN_LIMITS, toPlanKey, stripe, priceIdToPlan } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, Zap, Bot, Sparkles, TrendingUp, Shield, Crown } from "lucide-react";

const TIERS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "$49",
    period: "/mo",
    desc: "For solo operators ready to scale",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.25)",
    features: ["3 AI employees", "500 runs/month", "Email campaigns", "Social posting"],
  },
  {
    key: "GROWTH" as const,
    name: "Growth",
    price: "$149",
    period: "/mo",
    desc: "For ambitious growing teams",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.25)",
    features: ["10 AI employees", "2,000 runs/month", "Advanced analytics", "Priority support"],
    badge: "Most Popular",
  },
  {
    key: "SCALE" as const,
    name: "Scale",
    price: "$499",
    period: "/mo",
    desc: "For serious operators at scale",
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    features: ["Unlimited employees", "10,000 runs/month", "Custom integrations", "Dedicated support"],
  },
] as const;

/* ── Arc usage gauge ── */
function UsageArc({ pct, color }: { pct: number; color: string }) {
  const size = 160;
  const r = 64;
  const arcLen = Math.PI * r; // half circle arc length
  const dash = (pct / 100) * arcLen;
  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      {/* Track */}
      <path
        d={`M ${size*0.1},${size/2} A ${r},${r} 0 0,1 ${size*0.9},${size/2}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${size*0.1},${size/2} A ${r},${r} 0 0,1 ${size*0.9},${size/2}`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${arcLen}`}
        style={{ filter:`drop-shadow(0 0 8px ${color})`, transition:"stroke-dasharray 1.2s ease" }}
      />
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill="white"
        fontSize="28" fontWeight="900" fontFamily="inherit">{pct}%</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" fill="#52525b"
        fontSize="10" fontFamily="inherit" letterSpacing="2">USED</text>
    </svg>
  );
}

/* ── Tier feature check item ── */
function FeatureItem({ text, color }: { text: string; color: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-zinc-400">
      <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
        style={{ background:`${color}18`, border:`1px solid ${color}35` }}>
        <CheckCircle2 className="h-2.5 w-2.5" style={{ color }} />
      </div>
      {text}
    </li>
  );
}

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
  const usedPct = Math.min(100, Math.round((user.runsUsedThisPeriod / limits.monthlyRuns) * 100));
  const gaugeColor = usedPct > 90 ? "#ef4444" : usedPct > 70 ? "#f59e0b" : "#7c3aed";
  const currentTier = TIERS.find(t => t.key === toPlanKey(user.plan));

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes top-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes tier-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stat-pop{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
        @keyframes crown-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .tier-card{animation:tier-in 0.45s ease both}
        .tier-card:nth-child(1){animation-delay:0.05s}.tier-card:nth-child(2){animation-delay:0.12s}.tier-card:nth-child(3){animation-delay:0.19s}
        .upgrade-btn:hover{filter:brightness(1.18);transform:translateY(-1px)}
        .upgrade-btn{transition:all 0.2s ease}
        .top-bar{animation:top-flow 5s ease infinite;background-size:200% 200%}
        .stat-pop{animation:stat-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
        .crown-float{animation:crown-float 3s ease infinite}
      `}</style>

      {/* ── Animated top bar ── */}
      <div className="h-0.5 w-full rounded-full top-bar"
        style={{ background:"linear-gradient(90deg,#7c3aed,#0ea5e9,#10b981,#f59e0b,#7c3aed)" }} />

      {/* ── Cinematic Header ── */}
      <div className="relative rounded-3xl overflow-hidden p-8"
        style={{
          background:`linear-gradient(135deg,${currentTier ? currentTier.color + "0c" : "rgba(124,58,237,0.06)"} 0%,rgba(4,4,8,0.98) 60%,rgba(0,0,0,0.99) 100%)`,
          border:`1px solid ${currentTier ? currentTier.color + "20" : "rgba(124,58,237,0.15)"}`,
          backgroundImage:"radial-gradient(rgba(124,58,237,.05) 1px,transparent 1px)",
          backgroundSize:"28px 28px",
        }}>
        <div className="flex items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background:`linear-gradient(135deg,${currentTier ? currentTier.color + "30" : "rgba(124,58,237,0.2)"},${currentTier ? currentTier.color + "12" : "rgba(124,58,237,0.1)"})`,
                  border:`1px solid ${currentTier ? currentTier.color + "40" : "rgba(124,58,237,0.3)"}`,
                  boxShadow:`0 0 28px ${currentTier ? currentTier.glow : "rgba(124,58,237,0.2)"}`,
                }}>
                <CreditCard className="h-6 w-6" style={{ color: currentTier?.color ?? "#7c3aed" }} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest mb-0.5" style={{ color: currentTier?.color ?? "#7c3aed" }}>
                  Billing &amp; Plans
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none">{user.plan}</h1>
              </div>
            </div>
            {user.planRenewsAt && (
              <p className="text-zinc-600 text-sm ml-15">
                Renews {user.planRenewsAt.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}
              </p>
            )}
          </div>

          {/* Arc gauge */}
          <div className="flex flex-col items-center">
            <UsageArc pct={usedPct} color={gaugeColor} />
            <span className="text-xs text-zinc-600 uppercase tracking-widest -mt-1">
              {user.runsUsedThisPeriod.toLocaleString()} / {limits.monthlyRuns.toLocaleString()} runs
            </span>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6">
            {[
              { label:"Runs Used", val: user.runsUsedThisPeriod.toLocaleString(), icon: Zap, color: gaugeColor },
              { label:"Agents", val: limits.agents === 999 ? "∞" : String(limits.agents), icon: Bot, color:"#7c3aed" },
              { label:"Monthly Cap", val: limits.monthlyRuns.toLocaleString(), icon: TrendingUp, color:"#10b981" },
            ].map((s, i) => (
              <div key={s.label} className="stat-pop text-center" style={{ animationDelay:`${i*0.1}s` }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-1.5"
                  style={{ background:`${s.color}12`, border:`1px solid ${s.color}25` }}>
                  <s.icon className="h-3.5 w-3.5" style={{ color:s.color }} />
                </div>
                <div className="text-xl font-black text-white tabular-nums" style={{ color: s.val === "∞" ? "#10b981" : "white" }}>{s.val}</div>
                <div className="text-xs text-zinc-600 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Banners ── */}
      {error === "run_limit" && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", boxShadow:"0 0 20px rgba(239,68,68,0.06)" }}>
          <Zap className="h-5 w-5 text-red-400 shrink-0" />
          <span className="text-red-400 font-semibold text-sm">Run limit reached — upgrade to keep your AI workforce running.</span>
        </div>
      )}
      {error === "agent_limit" && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", boxShadow:"0 0 20px rgba(239,68,68,0.06)" }}>
          <Bot className="h-5 w-5 text-red-400 shrink-0" />
          <span className="text-red-400 font-semibold text-sm">Agent limit reached — upgrade to hire more AI employees.</span>
        </div>
      )}
      {success && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)", boxShadow:"0 0 20px rgba(16,185,129,0.08)" }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold text-sm">Payment successful — your plan has been upgraded. 🚀</span>
        </div>
      )}

      {/* ── Tier Cards ── */}
      <div className="grid gap-5 md:grid-cols-3">
        {TIERS.map((t) => {
          const isCurrent = toPlanKey(user.plan) === t.key;
          const planLimits = PLAN_LIMITS[t.key];
          const isPopular = !!t.badge;
          return (
            <div key={t.key} className="tier-card relative rounded-3xl overflow-hidden flex flex-col"
              style={{
                background: isCurrent
                  ? `linear-gradient(145deg,${t.color}10,rgba(4,4,8,0.98))`
                  : "rgba(4,4,8,0.9)",
                border: isCurrent
                  ? `1px solid ${t.color}50`
                  : isPopular
                  ? `1px solid ${t.color}30`
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isCurrent
                  ? `0 0 50px ${t.glow}, inset 0 0 40px ${t.color}05`
                  : "none",
              }}>

              {/* Top color strip */}
              <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${t.color},${t.color}66)` }} />

              {/* Badges */}
              {isCurrent && (
                <div className="absolute top-5 right-5 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background:`${t.color}20`, color:t.color, border:`1px solid ${t.color}40` }}>
                  <Crown className="h-3 w-3 crown-float" />Current Plan
                </div>
              )}
              {!isCurrent && isPopular && (
                <div className="absolute top-5 right-5 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background:`${t.color}20`, color:t.color, border:`1px solid ${t.color}40` }}>
                  <Sparkles className="h-3 w-3" />{t.badge}
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-0.5 mb-0.5">
                    <span className="text-4xl font-black" style={{ color:t.color, textShadow:`0 0 30px ${t.glow}` }}>{t.price}</span>
                    <span className="text-zinc-600 text-sm ml-1">{t.period}</span>
                  </div>
                  <div className="text-lg font-black text-white">{t.name}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{t.desc}</div>
                </div>

                {/* Runs highlight */}
                <div className="rounded-2xl p-3 mb-5"
                  style={{ background:`${t.color}08`, border:`1px solid ${t.color}20` }}>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 shrink-0" style={{ color:t.color }} />
                    <span className="text-sm font-bold text-white">{planLimits.monthlyRuns.toLocaleString()} runs/mo</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {t.features.map(f => <FeatureItem key={f} text={f} color={t.color} />)}
                  <FeatureItem text={`${planLimits.agents === 999 ? "Unlimited" : planLimits.agents} AI employees`} color={t.color} />
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <form action="/api/stripe/portal" method="POST">
                    <button type="submit"
                      className="upgrade-btn w-full rounded-xl py-3 text-sm font-bold transition-all"
                      style={{
                        background:`${t.color}12`,
                        border:`1px solid ${t.color}30`,
                        color: t.color,
                      }}>
                      <span className="flex items-center justify-center gap-2">
                        <Shield className="h-3.5 w-3.5" />Manage subscription
                      </span>
                    </button>
                  </form>
                ) : (
                  <form action="/api/stripe/checkout" method="POST">
                    <input type="hidden" name="plan" value={t.key} />
                    <button type="submit"
                      className="upgrade-btn w-full rounded-xl py-3 text-sm font-bold text-white"
                      style={{
                        background:`linear-gradient(135deg,${t.color},${t.color}bb)`,
                        boxShadow:`0 0 24px ${t.glow}`,
                      }}>
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
