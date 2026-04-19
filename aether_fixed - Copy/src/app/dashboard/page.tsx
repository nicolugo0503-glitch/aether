import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import { Bot, Play, Gauge, TrendingUp, ArrowRight, Plus, Sparkles, Activity, Zap } from "lucide-react";

export default async function DashboardHome() {
  const user = (await getCurrentUser())!;
  const [agents, recentRuns, totals] = await Promise.all([
    prisma.agent.count({ where: { userId: user.id } }),
    prisma.run.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { agent: true },
    }),
    prisma.run.aggregate({
      where: { userId: user.id, status: "success" },
      _sum: { tokensIn: true, tokensOut: true, costCents: true },
      _count: true,
    }),
  ]);

  const planKey = toPlanKey(user.plan);
  const limits = PLAN_LIMITS[planKey];
  const usagePct = Math.min(100, (user.runsUsedThisPeriod / limits.monthlyRuns) * 100);

  const stats = [
    {
      icon: Bot,
      label: "AI Employees",
      value: `${agents}`,
      sub: `of ${limits.agents} seats used`,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Play,
      label: "Successful Runs",
      value: String(totals._count ?? 0),
      sub: "total across all agents",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Gauge,
      label: "Usage This Period",
      value: `${user.runsUsedThisPeriod}`,
      sub: `of ${limits.monthlyRuns.toLocaleString()} runs`,
      color: "text-accent-2",
      bg: "bg-accent-2/10",
    },
    {
      icon: TrendingUp,
      label: "Total AI Spend",
      value: centsToUSD(totals._sum.costCents ?? 0),
      sub: "all-time cost",
      color: "text-accent-3",
      bg: "bg-accent-3/10",
    },
  ];

  const isNewUser = recentRuns.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-muted">
            Your AI workforce overview. {isNewUser ? "Let's get your first agent running." : `${totals._count} successful runs and counting.`}
          </p>
        </div>
        <Link href="/dashboard/agents" className="btn-primary hidden md:flex">
          <Plus className="h-4 w-4" />
          New AI Employee
        </Link>
      </div>

      {/* Onboarding banner for new users */}
      {isNewUser && (
        <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-accent-3/5 to-accent-2/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">Your AI employee is ready to work</h2>
              <p className="text-sm text-muted mb-4">
                We pre-built <strong className="text-text">Ava, your AI SDR</strong>, for you. She's ready to draft cold emails the moment you run her.
                Here's how to get started:
              </p>
              <div className="grid gap-3 md:grid-cols-3 mb-5">
                {[
                  { step: "1", title: "Open Ava", body: "Go to AI Employees and select Ava.", action: "/dashboard/agents" },
                  { step: "2", title: "Run her", body: "Give her a lead name or company and hit Run.", action: "/dashboard/agents" },
                  { step: "3", title: "See the output", body: "A personalized cold email in seconds.", action: "/dashboard/runs" },
                ].map((s) => (
                  <Link key={s.step} href={s.action} className="rounded-xl border border-border bg-panel p-4 hover:border-accent/30 transition-colors group">
                    <div className="text-xs font-bold text-accent mb-1">Step {s.step}</div>
                    <div className="text-sm font-semibold mb-1">{s.title}</div>
                    <div className="text-xs text-muted">{s.body}</div>
                  </Link>
                ))}
              </div>
              <Link href="/dashboard/agents" className="btn-primary inline-flex">
                Meet your AI employees
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} mb-4`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-muted uppercase tracking-wide">{s.label}</div>
            <div className="mt-0.5 text-xs text-muted-2">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Usage progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Run usage this period
            </h2>
            <p className="text-xs text-muted mt-0.5">Resets on your next billing cycle</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{user.runsUsedThisPeriod}</div>
            <div className="text-xs text-muted">of {limits.monthlyRuns.toLocaleString()}</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${usagePct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted">{usagePct.toFixed(0)}% used</div>
          {planKey !== "SCALE" && usagePct >= 70 && (
            <Link href="/dashboard/billing" className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Upgrade for more runs →
            </Link>
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Recent runs</h2>
          <Link href="/dashboard/runs" className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-elevated mb-4">
              <Play className="h-6 w-6 text-muted" />
            </div>
            <p className="text-sm font-medium mb-1">No runs yet</p>
            <p className="text-xs text-muted mb-4">Run your first AI employee to see results here.</p>
            <Link href="/dashboard/agents" className="btn-primary text-sm px-4 py-2">
              Run an AI employee →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.agent.name}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td className="text-muted">{(r.tokensIn + r.tokensOut).toLocaleString()}</td>
                    <td className="text-muted">{centsToUSD(r.costCents)}</td>
                    <td className="text-muted">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Hire an AI employee",
            body: "Add a new specialized agent to your workforce.",
            icon: Bot,
            href: "/dashboard/agents",
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            title: "View all runs",
            body: "See every execution, cost, and output in one place.",
            icon: ListChecksIcon,
            href: "/dashboard/runs",
            color: "text-accent-2",
            bg: "bg-accent-2/10",
          },
          {
            title: "Upgrade your plan",
            body: "Unlock more runs, more agents, and advanced features.",
            icon: Sparkles,
            href: "/dashboard/billing",
            color: "text-accent-3",
            bg: "bg-accent-3/10",
          },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="card-hover group flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">{item.title}</div>
              <div className="text-xs text-muted">{item.body}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted mt-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ListChecksIcon(props: { className?: string }) {
  return <Play {...props} />;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "pill-success",
    error:   "pill-error",
    running: "pill-warning",
    pending: "pill-neutral",
  };
  const dot: Record<string, string> = {
    success: "bg-success",
    error:   "bg-danger",
    running: "bg-warning animate-pulse",
    pending: "bg-muted",
  };
  return (
    <span className={`pill ${map[status] ?? "pill-neutral"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? "bg-muted"}`} />
      {status}
    </span>
  );
}
