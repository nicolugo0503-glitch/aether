import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import { Bot, Play, Gauge } from "lucide-react";

export default async function DashboardHome() {
  const user = (await getCurrentUser())!;
  const [agents, recentRuns, totals] = await Promise.all([
    prisma.agent.count({ where: { userId: user.id } }),
    prisma.run.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { agent: true },
    }),
    prisma.run.aggregate({
      where: { userId: user.id, status: "success" },
      _sum: { tokensIn: true, tokensOut: true, costCents: true },
      _count: true,
    }),
  ]);

  const limits = PLAN_LIMITS[toPlanKey(user.plan)];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
        <p className="text-sm text-muted">Your workforce at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Bot} label="AI employees" value={`${agents} / ${limits.agents}`} />
        <StatCard icon={Play} label="Runs (successful)" value={String(totals._count ?? 0)} />
        <StatCard icon={Gauge} label="Runs used this period" value={`${user.runsUsedThisPeriod} / ${limits.monthlyRuns}`} />
        <StatCard icon={Gauge} label="Est. spend" value={centsToUSD(totals._sum.costCents ?? 0)} />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent runs</h2>
          <Link href="/dashboard/runs" className="link text-sm">View all →</Link>
        </div>
        {recentRuns.length === 0 ? (
          <p className="text-sm text-muted">
            No runs yet.{" "}
            <Link href="/dashboard/agents" className="link">
              Run your first AI employee
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Agent</th>
                <th>Status</th>
                <th>Cost</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRuns.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.agent.name}</td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                  <td>{centsToUSD(r.costCents)}</td>
                  <td className="text-muted">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: { icon: any; label: string; value: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    error:   "bg-red-500/10 text-red-300 border-red-500/30",
    running: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    pending: "bg-muted/10 text-muted border-border",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs ${map[status] ?? map.pending}`}
    >
      {status}
    </span>
  );
}
