import { getCurrentUser } from "@/lib/auth";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";

const tiers = [
  { key: "STARTER", name: "Starter", price: "$49" },
  { key: "GROWTH",  name: "Growth",  price: "$299" },
  { key: "SCALE",   name: "Scale",   price: "$1,499" },
] as const;

export default async function BillingPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = (await getCurrentUser())!;
  const { error, success } = await searchParams;
  const limits = PLAN_LIMITS[toPlanKey(user.plan)];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted">
          Current plan: <span className="text-white">{user.plan}</span>
          {user.planRenewsAt && ` · renews ${user.planRenewsAt.toLocaleDateString()}`}
        </p>
      </div>

      {error === "run_limit" && (
        <Banner kind="error">
          You've hit your run limit for this period. Upgrade to keep shipping.
        </Banner>
      )}
      {error === "agent_limit" && (
        <Banner kind="error">
          You've hit your AI employee limit. Upgrade to hire more.
        </Banner>
      )}
      {success && <Banner kind="success">Payment successful. Welcome to the next tier.</Banner>}

      <div className="card">
        <h2 className="font-semibold">Usage</h2>
        <div className="mt-3 text-sm text-muted">
          {user.runsUsedThisPeriod} / {limits.monthlyRuns} runs used this period
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg">
          <div
            className="h-full bg-accent"
            style={{
              width: `${Math.min(100, (user.runsUsedThisPeriod / limits.monthlyRuns) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.key}
            className={
              "card " + (user.plan === t.key ? "border-accent" : "")
            }
          >
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">{t.name}</h3>
              <span className="text-xs text-muted">{t.price}/mo</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li>{PLAN_LIMITS[t.key].agents} AI employees</li>
              <li>{PLAN_LIMITS[t.key].monthlyRuns.toLocaleString()} runs / mo</li>
            </ul>
            {user.plan === t.key ? (
              <form action="/api/stripe/portal" method="POST" className="mt-4">
                <button className="btn-secondary w-full">Manage subscription</button>
              </form>
            ) : (
              <form action="/api/stripe/checkout" method="POST" className="mt-4">
                <input type="hidden" name="plan" value={t.key} />
                <button className="btn-primary w-full">Upgrade</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Banner({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const cls =
    kind === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  return <div className={`rounded-md border px-4 py-2 text-sm ${cls}`}>{children}</div>;
}
