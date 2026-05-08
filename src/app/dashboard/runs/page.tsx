import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToUSD, formatDate } from "@/lib/utils";
import { ListChecks, CheckCircle2, XCircle, Loader2, Clock, Zap, DollarSign, TrendingUp } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", border:"1px solid rgba(16,185,129,0.2)" }}>
      <CheckCircle2 className="h-3 w-3" />success
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.2)" }}>
      <XCircle className="h-3 w-3" />error
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)" }}>
      <Loader2 className="h-3 w-3 animate-spin" />running
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(255,255,255,0.04)", color:"#71717a", border:"1px solid rgba(255,255,255,0.08)" }}>
      <Clock className="h-3 w-3" />{status}
    </span>
  );
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

export default async function RunsPage() {
  const user = (await getCurrentUser())!;
  const [runs, totals] = await Promise.all([
    prisma.run.findMany({
      where: { userId: user.id },
      include: { agent: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.run.aggregate({
      where: { userId: user.id },
      _sum: { tokensIn: true, tokensOut: true, costCents: true },
      _count: true,
    }),
  ]);

  const successCount = runs.filter(r => r.status === "success").length;
  const errorCount   = runs.filter(r => r.status === "error").length;
  const successRate  = runs.length ? Math.round((successCount / runs.length) * 100) : 0;

  const stats = [
    { label:"Total Runs",     value: totals._count,                          icon: ListChecks, color:"#7c3aed" },
    { label:"Success Rate",   value: `${successRate}%`,                       icon: TrendingUp, color:"#10b981" },
    { label:"Total Tokens",   value: ((totals._sum.tokensIn??0)+(totals._sum.tokensOut??0)).toLocaleString(), icon: Zap, color:"#f59e0b" },
    { label:"Total Spend",    value: centsToUSD(totals._sum.costCents ?? 0),   icon: DollarSign, color:"#0ea5e9" },
  ];

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes row-enter{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .run-row{animation:row-enter 0.3s ease both}
        .run-row:hover{background:rgba(255,255,255,0.025)!important}
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
          <ListChecks style={{ width:18, height:18 }} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Runs</h1>
          <p className="text-sm text-zinc-500">Last 100 executions across all agents.</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-zinc-600">{s.label}</span>
              <div className="h-6 w-6 rounded-lg flex items-center justify-center"
                style={{ background:`${s.color}18` }}>
                <s.icon className="h-3 w-3" style={{ color:s.color }} />
              </div>
            </div>
            <div className="text-xl font-black text-white tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Runs Table ── */}
      {runs.length === 0 ? (
        <div className="rounded-3xl py-16 text-center"
          style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(255,255,255,0.08)" }}>
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <ListChecks className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">No runs yet</h3>
          <p className="text-zinc-500 text-sm">Head to <span className="text-violet-400">AI Employees</span> and trigger a run.</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(255,255,255,0.06)" }}>
          {/* Table header */}
          <div className="px-6 py-3 grid grid-cols-12 gap-3 text-xs uppercase tracking-widest text-zinc-700"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div className="col-span-3">Agent</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Tokens</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-2 text-right">When</div>
          </div>

          <div className="divide-y" style={{ borderColor:"rgba(255,255,255,0.04)" }}>
            {runs.map((r, i) => {
              const tokenTotal = (r.tokensIn ?? 0) + (r.tokensOut ?? 0);
              const delay = Math.min(i * 0.02, 0.5);
              return (
                <div key={r.id}
                  className="run-row px-6 py-3.5 grid grid-cols-12 gap-3 items-center transition-colors"
                  style={{ animationDelay:`${delay}s` }}>
                  <div className="col-span-3 min-w-0">
                    <div className="font-medium text-sm text-white truncate">{r.agent.name}</div>
                    <div className="text-xs text-zinc-600 truncate">{r.agent.role}</div>
                  </div>
                  <div className="col-span-2"><StatusBadge status={r.status} /></div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-zinc-300 tabular-nums">{tokenTotal.toLocaleString()}</span>
                      {tokenTotal > 0 && (
                        <div className="flex-1 max-w-16 h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{
                            width:`${Math.min(100, (tokenTotal / 5000) * 100)}%`,
                            background:"linear-gradient(90deg,#7c3aed,#6d28d9)"
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-zinc-400 tabular-nums">{centsToUSD(r.costCents ?? 0)}</div>
                  <div className="col-span-2 text-right text-xs text-zinc-600" title={formatDate(r.createdAt)}>
                    {timeAgo(r.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ borderTop:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.01)" }}>
            <span className="text-xs text-zinc-700">{runs.length} run{runs.length !== 1 ? "s" : ""} shown</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                {successCount} succeeded
              </span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                  {errorCount} failed
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
