import { getCurrentUser } from "@/lib/auth";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Check, CreditCard, Sparkles, TrendingUp, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    key: "STARTER",
    name: "Starter",
    price: "$49",
    description: "For solo operators and small teams.",
    color: "border-violet-500/20 bg-violet-500/5",
    highlight: false,
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: "$299",
    description: "For teams scaling AI across the business.",
    color: "border-accent bg-accent/5",
    highlight: true,
  },
  {
    key: "SCALE",
    name: "Scale",
    price: "$1,499",
    description: "For companies building an autonomous workforce.",
    color: "border-amber-500/20 bg-amber-500/5",
    highlight: false,
  },
] as const;

export default async function BillingPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = (await getCurrentUser())!;
  const { error, success } = await searchParams;
  const planKey = toPlanKey(user.plan);
  const limits = PLAN_LIMITS[planKey];
  const usagePct = Math.min(100, (user.runsUsedThisPeriod / limits.monthlyRuns) * 100);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted">
          Manage your plan, usage, and payment details.
        </p>
      </div>

      {/* Banners */}
      {error === "run_limit" && (
        <Banner kind="error" icon={AlertCircle}>
          You've hit your run limit for this period. Upgrade to keep shipping.
        </Banner>
      )}
      {error === "agent_limit" && (
        <Banner kind="error" icon={AlertCircle}>
          You've hit your AI employee limit. Upgrade to hire more.
        </Banner>
      )}
      {error === "missing_price" && (
        <Banner kind="warning" icon={AlertCircle}>
          Stripe isn't fully configured yet. Add your STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH,
          and STRIPE_PRICE_SCALE environment variables in Vercel to enable upgrades.
        </Banner>
      )}
      {success && (
        <Banner kind="success" icon={Check}>
          Payment successful — welcome to the next tier! 🎉
        </Banner>
      )}

      {/* Current plan card */}
      <div className="card border-accent/30 bg-gradient-to-br from-accent/5 to-panel">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
              <CreditCard className="h-7 w-7 text-accent" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted mb-0.5">Current plan</div>
              <div className="text-2xl font-bold">{planKey}</div>
              {user.planRenewsAt && (
                <div className="text-xs text-muted mt-0.5">
                  Renews {user.planRenewsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          </div>
          {planKey !== "FREE" && (
            <form action="/api/stripe/portal" method="POST">
              <button className="btn-secondary px-5 py-2.5 rounded-xl">
                Manage subscription →
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-2/10">
            <TrendingUp className="h-5 w-5 text-accent-2" />
          </div>
          <div>
            <h2 className="font-semibold">Usage this period</h2>
            <p className="text-xs text-muted">Resets on your billing cycle</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold">{user.runsUsedThisPeriod}</div>
            <div className="text-xs text-muted">of {limits.monthlyRuns.toLocaleString()} runs</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${usagePct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-xs text-muted">{usagePct.toFixed(0)}% used</span>
          {usagePct >= 80 && planKey !== "SCALE" && (
            <span className="text-xs text-warning flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Getting close — consider upgrading
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "AI Employee Slots", value: `${limits.agents} available` },
            { label: "Runs this period", value: `${user.runsUsedThisPeriod} / ${limits.monthlyRuns.toLocaleString()}` },
            { label: "Plan", value: planKey },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-elevated p-4">
              <div className="label mb-1">{s.label}</div>
              <div className="font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade plans */}
      {planKey !== "SCALE" && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Upgrade your plan</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((t) => {
              const isCurrentPlan = user.plan === t.key;
              const tierLimits = PLAN_LIMITS[t.key];
              return (
                <div
                  key={t.key}
                  className={`relative rounded-2xl border p-6 ${t.color} ${isCurrentPlan ? "ring-2 ring-accent/40" : ""}`}
                >
                  {t.highlight && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-semibold text-white">
                      <Zap className="h-2.5 w-2.5" />
                      Most popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent/20 border border-accent/30 px-3 py-0.5 text-xs font-semibold text-accent">
                      Current plan
                    </div>
                  )}

                  <div className="text-sm font-medium text-muted">{t.name}</div>
                  <div className="text-3xl font-bold mt-1">
                    {t.price}
                    <span className="text-sm font-normal text-muted">/mo</span>
                  </div>
                  <p className="text-xs text-muted mt-2 mb-4">{t.description}</p>

                  <div className="space-y-2 text-sm text-muted mb-5">
                    {[
                      `${tierLimits.agents} AI employees`,
                      `${tierLimits.monthlyRuns.toLocaleString()} runs / month`,
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-success shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {isCurrentPlan ? (
                    <form action="/api/stripe/portal" method="POST">
                      <button className="btn-secondary w-full rounded-xl py-2.5 text-sm">
                        Manage subscription
                      </button>
                    </form>
                  ) : (
                    <form action="/api/stripe/checkout" method="POST">
                      <input type="hidden" name="plan" value={t.key} />
                      <button className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${t.highlight ? "btn-primary" : "btn-secondary"}`}>
                        Upgrade to {t.name}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-sm text-muted">
            Need 100+ employees or custom terms?{" "}
            <Link href="#" className="link">Talk to sales →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function Banner({
  kind,
  icon: Icon,
  children,
}: {
  kind: "error" | "success" | "warning";
  icon: any;
  children: React.ReactNode;
}) {
  const styles = {
    error:   "border-danger/30 bg-danger/10 text-red-300",
    success: "border-success/30 bg-success/10 text-emerald-300",
    warning: "border-warning/30 bg-warning/10 text-amber-300",
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[kind]}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
