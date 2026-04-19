import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToUSD, formatDate } from "@/lib/utils";
import { StatusPill } from "../page";
import { Activity, Play } from "lucide-react";
import Link from "next/link";

export default async function RunsPage() {
  const user = (await getCurrentUser())!;
  const runs = await prisma.run.findMany({
    where: { userId: user.id },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalCost = runs.reduce((s, r) => s + r.costCents, 0);
  const successCount = runs.filter((r) => r.status === "success").length;
  const totalTokens = runs.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Runs</h1>
        <p className="mt-1 text-muted">
          Last 100 executions across all AI employees.
        </p>
      </div>

      {/* Summary cards */}
      {runs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total runs shown", value: String(runs.length), sub: "last 100 executions" },
            { label: "Successful", value: String(successCount), sub: `${runs.length > 0 ? ((successCount / runs.length) * 100).toFixed(0) : 0}% success rate` },
            { label: "Total cost", value: centsToUSD(totalCost), sub: `${(totalTokens / 1000).toFixed(1)}k tokens used` },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs uppercase tracking-wide text-muted mt-1">{s.label}</div>
              <div className="text-xs text-muted-2 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {runs.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-elevated mb-4">
            <Activity className="h-7 w-7 text-muted" />
          </div>
          <h3 className="font-semibold mb-2">No runs yet</h3>
          <p className="text-sm text-muted mb-6 max-w-xs">
            Head to AI Employees and run one of your agents to see execution history here.
          </p>
          <Link href="/dashboard/agents" className="btn-primary">
            <Play className="h-4 w-4" />
            Run an AI employee
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <h2 className="font-semibold">Execution history</h2>
            <span className="text-xs text-muted">{runs.length} runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Tokens in</th>
                  <th>Tokens out</th>
                  <th>Cost</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.agent.name}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td className="text-muted">{r.tokensIn.toLocaleString()}</td>
                    <td className="text-muted">{r.tokensOut.toLocaleString()}</td>
                    <td className="text-muted">{centsToUSD(r.costCents)}</td>
                    <td className="text-muted">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
