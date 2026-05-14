import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Radar,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bell,
  BellOff,
  ChevronRight,
} from "lucide-react";
import { severityColor, severityLabel } from "@/lib/competitor";

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

async function createCompetitor(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const category = String(formData.get("category") || "general");
  const focus = String(formData.get("focus") || "").trim();
  const frequency = String(formData.get("frequency") || "daily");

  if (!name || !url) return;
  try {
    new URL(url);
  } catch {
    return;
  }

  await prisma.competitor.create({
    data: {
      userId: user.id,
      name,
      url,
      category,
      focus: focus || null,
      frequency,
      notifyEmail: true,
      nextScanAt: new Date(),
    },
  });

  redirect("/dashboard/competitors");
}

export default async function CompetitorsPage() {
  const user = (await getCurrentUser())!;

  const [competitors, unreadChanges] = await Promise.all([
    prisma.competitor.findMany({
      where: { userId: user.id },
      orderBy: [{ lastChangeAt: "desc" }, { updatedAt: "desc" }],
    }).catch(() => []),
    prisma.competitorChange.count({
      where: { userId: user.id, read: false },
    }).catch(() => 0),
  ]);

  const enabledCount = competitors.filter((c) => c.enabled).length;
  const totalChanges = competitors.reduce((s, c) => s + c.totalChanges, 0);
  const criticalCount = competitors.filter(
    (c) => c.lastSeverity === "critical" || c.lastSeverity === "high",
  ).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────── */}
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
            <Radar className="h-5 w-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Competitor Intelligence
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Aether watches your competitors&apos; pages 24/7 and tells you when
              something material changes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Trackers" value={competitors.length} accent="#a78bfa" />
          <StatCard label="Watching" value={enabledCount} accent="#22c55e" />
          <StatCard label="Changes detected" value={totalChanges} accent="#7c3aed" />
          <StatCard
            label="High-priority alerts"
            value={criticalCount}
            accent={criticalCount > 0 ? "#fb7185" : "#71717a"}
          />
        </div>

        {unreadChanges > 0 && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.30)",
            }}
          >
            <Bell className="h-4 w-4" style={{ color: "#a78bfa" }} />
            <span className="text-sm text-white font-semibold">
              {unreadChanges} unread {unreadChanges === 1 ? "change" : "changes"}
            </span>
            <span className="text-xs text-zinc-500">
              — open a tracker below to review what shipped.
            </span>
          </div>
        )}
      </div>

      {/* ── Add tracker form ───────────────────────────── */}
      <form
        action={createCompetitor}
        className="mb-8 rounded-2xl p-5"
        style={{
          background: "rgba(124,58,237,0.04)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-4 w-4" style={{ color: "#a78bfa" }} />
          <h2 className="text-sm font-bold text-white">Track a competitor page</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            name="name"
            required
            placeholder="Display name (e.g. Acme — Pricing)"
            className="md:col-span-3 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
          <input
            name="url"
            required
            type="url"
            placeholder="https://acme.com/pricing"
            className="md:col-span-4 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
          <select
            name="category"
            defaultValue="general"
            className="md:col-span-2 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <option value="pricing">Pricing</option>
            <option value="homepage">Homepage</option>
            <option value="product">Product</option>
            <option value="blog">Blog</option>
            <option value="careers">Careers</option>
            <option value="general">General</option>
          </select>
          <select
            name="frequency"
            defaultValue="daily"
            className="md:col-span-2 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <option value="hourly">Every hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            type="submit"
            className="md:col-span-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
            }}
          >
            Add
          </button>
        </div>
        <input
          name="focus"
          placeholder="(Optional) What should the AI pay attention to? e.g. 'pricing tiers, enterprise plan'"
          className="mt-3 w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
      </form>

      {/* ── Trackers list ──────────────────────────────── */}
      {competitors.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {competitors.map((c) => {
            const sevc = severityColor(c.lastSeverity || "low");
            return (
              <Link
                key={c.id}
                href={`/dashboard/competitors/${c.id}`}
                className="block rounded-2xl p-5 transition-all hover:translate-y-[-1px]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white truncate">
                        {c.name}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{
                          background: "rgba(124,58,237,0.10)",
                          color: "#a78bfa",
                          border: "1px solid rgba(124,58,237,0.25)",
                        }}
                      >
                        {c.category}
                      </span>
                      {c.enabled ? (
                        <span className="text-[10px] font-semibold text-emerald-400 inline-flex items-center gap-1">
                          <Activity className="h-3 w-3" /> watching
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-500 inline-flex items-center gap-1">
                          <BellOff className="h-3 w-3" /> paused
                        </span>
                      )}
                      {c.lastError && (
                        <span className="text-[10px] font-semibold text-amber-400 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> last scan failed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.url}</span>
                    </div>
                    {c.lastSummary ? (
                      <div className="mt-3 text-sm text-zinc-300">
                        <span
                          className="inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 mr-2 align-middle"
                          style={{
                            color: sevc.text,
                            background: sevc.bg,
                            border: `1px solid ${sevc.border}`,
                          }}
                        >
                          {severityLabel(c.lastSeverity || "low")}
                        </span>
                        {c.lastSummary}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-zinc-600 italic">
                        {c.totalScans === 0
                          ? "Baseline scan pending — Aether will scan within the next minute."
                          : "No material changes detected yet."}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-auto">
                    <div className="text-xs text-zinc-500">
                      Last change <strong className="text-white">{timeAgo(c.lastChangeAt)}</strong>
                    </div>
                    <div className="text-[11px] text-zinc-600">
                      {c.totalChanges} {c.totalChanges === 1 ? "change" : "changes"} · {c.totalScans} scans
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-violet-400 mt-1">
                      Open <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-black" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.10)",
      }}
    >
      <Radar className="h-10 w-10 mx-auto mb-3" style={{ color: "#a78bfa" }} />
      <h3 className="text-lg font-black text-white mb-1">No trackers yet</h3>
      <p className="text-sm text-zinc-500 max-w-md mx-auto mb-4">
        Add a competitor URL above — pricing pages, blogs, careers pages, comparison
        pages. Aether will fetch the page on a schedule and use GPT to summarize what
        changed and why it matters.
      </p>
      <div className="text-[11px] text-zinc-600 inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3" /> Catches pricing changes, feature launches,
        hiring surges, messaging pivots, funding news.
      </div>
    </div>
  );
}
