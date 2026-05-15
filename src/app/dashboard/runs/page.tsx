import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ListChecks, CheckCircle2, XCircle, Loader2, Clock, Zap, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Runs | Aether Dashboard",
};

function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = Date.now() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

type StatusKey = "COMPLETED" | "FAILED" | "RUNNING" | "PENDING" | string;

function statusStyle(status: StatusKey) {
  const s = status?.toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS")
    return { bg: "rgba(16,185,129,0.10)", fg: "#10b981", border: "rgba(16,185,129,0.3)", label: "Completed" };
  if (s === "FAILED" || s === "ERROR")
    return { bg: "rgba(239,68,68,0.10)", fg: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Failed" };
  if (s === "RUNNING")
    return { bg: "rgba(245,158,11,0.10)", fg: "#f59e0b", border: "rgba(245,158,11,0.3)", label: "Running" };
  return { bg: "rgba(99,102,241,0.10)", fg: "#818cf8", border: "rgba(99,102,241,0.3)", label: "Pending" };
}

export default async function RunsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const runs = await prisma.run.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { agent: { select: { name: true } } },
  }).catch(() => []);

  const total = runs.length;
  const completed = runs.filter((r) => ["success","completed","COMPLETED","SUCCESS"].includes(r.status)).length;
  const failed = runs.filter((r) => ["error","failed","FAILED","ERROR"].includes(r.status)).length;
  const running = runs.filter((r) => ["running","RUNNING"].includes(r.status)).length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.06))",
              border: "1px solid rgba(124,58,237,0.25)",
              boxShadow: "0 0 24px rgba(124,58,237,0.18)",
            }}
          >
            <ListChecks className="h-5 w-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Runs</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Every agent execution — status, cost, and output at a glance.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Total runs"    value={total}       accent="#a78bfa" icon={<ListChecks className="h-3.5 w-3.5" />} />
          <StatCard label="Completed"     value={completed}   accent="#10b981" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
          <StatCard label="Failed"        value={failed}      accent={failed > 0 ? "#ef4444" : "#52525b"} icon={<XCircle className="h-3.5 w-3.5" />} />
          <StatCard label="Success rate"  value={`${successRate}%`} accent={successRate >= 80 ? "#10b981" : successRate >= 50 ? "#f59e0b" : "#ef4444"} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {/* Table */}
      {total === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <ListChecks className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
          <div className="text-white font-bold mb-1">No runs yet</div>
          <div className="text-sm text-zinc-500">
            Trigger an agent or workflow to see execution history here.
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Active indicator strip */}
          {running > 0 && (
            <div
              className="px-5 py-2.5 flex items-center gap-2 text-xs font-semibold"
              style={{
                background: "rgba(245,158,11,0.06)",
                borderBottom: "1px solid rgba(245,158,11,0.15)",
                color: "#f59e0b",
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {running} run{running > 1 ? "s" : ""} currently executing
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs text-zinc-500 uppercase tracking-wider"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Agent</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Cost</th>
                  <th className="px-5 py-3 font-semibold">Output</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => {
                  const st = statusStyle(run.status);
                  const r = run as any;
                  return (
                    <tr
                      key={run.id}
                      style={{
                        borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td className="px-5 py-4 text-xs font-mono text-zinc-600">
                        #{String(idx + 1).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {r.agent?.name || "Unknown Agent"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold"
                          style={{ background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              background: st.fg,
                              boxShadow: `0 0 4px ${st.fg}`,
                            }}
                          />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {timeAgo(run.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {r.costCents != null && r.costCents > 0 ? (
                          <span className="font-semibold text-emerald-400">
                            ${(r.costCents / 100).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500 max-w-xs">
                        {r.output ? (
                          <span className="truncate block">{r.output.substring(0, 100)}{r.output.length > 100 ? "…" : ""}</span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total >= 100 && (
            <div
              className="px-5 py-3 text-xs text-zinc-600 text-center"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              Showing most recent 100 runs
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number | string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest mb-2"
        style={{ color: accent }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-3xl font-black text-white tabular-nums">{value}</div>
    </div>
  );
}
