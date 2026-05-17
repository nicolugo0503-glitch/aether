// AI Predictive Churn Detection — Admin Dashboard
// ─────────────────────────────────────────────────────────────
// Standalone admin page at /admin/churn?secret=<ADMIN_SECRET>.
// Renders the at-risk customer list with AI-generated reasoning,
// red-flag signals, and recommended save plays for the CSM team.
//
// This page intentionally lives OUTSIDE /dashboard so it does not
// require an end-user login — admin auth is the ADMIN_SECRET URL
// param, matching the rest of /api/admin/*.

import type { CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  AlertTriangle, Activity, ShieldCheck, Mail, Phone, BookOpen,
  Percent, ArrowRight, RefreshCcw, ChevronRight, Users, TrendingDown,
} from "lucide-react";
import {
  tierColor as churnTierColor,
  tierLabel as churnTierLabel,
  type ChurnTier,
} from "@/lib/churn";

export const dynamic = "force-dynamic";

// Approximate monthly revenue (cents) per paid tier — used to surface
// "revenue at risk" so the CSM team can prioritize accordingly.
const PLAN_VALUE = {
  STARTER: 4900,
  GROWTH:  14900,
  SCALE:   49900,
} as const;

// We don't want to leak this page existing if the secret is wrong.
function unauthorizedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "#fff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>404</h1>
        <p style={{ color: "#71717a", fontSize: 14 }}>Page not found.</p>
      </div>
    </main>
  );
}

interface PageProps {
  searchParams: Promise<{ secret?: string; tier?: string }>;
}

export default async function AdminChurnPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || sp.secret !== adminSecret) {
    return unauthorizedPage();
  }

  const tierFilter = (sp.tier || "").toUpperCase();
  const validTiers = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "HEALTHY"] as const;
  const activeTier = (validTiers as readonly string[]).includes(tierFilter)
    ? (tierFilter as ChurnTier)
    : null;

  // ── Top-line stats — totals across the whole user base
  const [totalUsers, payingUsers, criticalCount, highCount, mediumCount, lowCount, healthyCount, analyzedCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { plan: { not: "FREE" } } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: "CRITICAL" } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: "HIGH" } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: "MEDIUM" } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: "LOW" } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: "HEALTHY" } }).catch(() => 0),
    prisma.user.count({ where: { churnPredictedAt: { not: null } } }).catch(() => 0),
  ]);

  // ── At-risk users (latest snapshot)
  const where = activeTier
    ? { churnRiskTier: activeTier, churnPredictedAt: { not: null } }
    : { churnPredictedAt: { not: null } };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ churnRiskScore: "desc" }, { churnPredictedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      createdAt: true,
      planRenewsAt: true,
      runsUsedThisPeriod: true,
      churnRiskScore: true,
      churnRiskTier: true,
      churnPredictedAt: true,
    },
  }).catch(() => []);

  // ── Pull latest ChurnPrediction row per user for reasoning + save action
  const predictions = users.length
    ? await prisma.churnPrediction.findMany({
        where: { userId: { in: users.map(u => u.id) } },
        orderBy: { createdAt: "desc" },
      }).catch(() => [])
    : [];
  const latestById = new Map<string, typeof predictions[number]>();
  for (const p of predictions) if (!latestById.has(p.userId)) latestById.set(p.userId, p);

  // ── Aggregate AI cost spent on churn analysis (last 30d)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const costAgg = await prisma.churnPrediction.aggregate({
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: { costCents: true, tokensIn: true, tokensOut: true },
    _count: true,
  }).catch(() => ({ _sum: { costCents: 0, tokensIn: 0, tokensOut: 0 }, _count: 0 }));

  const [atRiskStarter, atRiskGrowth, atRiskScale] = await Promise.all([
    prisma.user.count({ where: { churnRiskTier: { in: ["CRITICAL", "HIGH"] }, plan: "STARTER" } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: { in: ["CRITICAL", "HIGH"] }, plan: "GROWTH"  } }).catch(() => 0),
    prisma.user.count({ where: { churnRiskTier: { in: ["CRITICAL", "HIGH"] }, plan: "SCALE"   } }).catch(() => 0),
  ]);
  const csmRevenueAtRisk =
    PLAN_VALUE.STARTER * atRiskStarter +
    PLAN_VALUE.GROWTH  * atRiskGrowth  +
    PLAN_VALUE.SCALE   * atRiskScale;

  return (
    <main style={{ minHeight: "100vh", background: "#09090b", color: "#fff", paddingBottom: 80 }}>
      {/* ── Top bar ───────────────────────────────────── */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 18px rgba(124,58,237,0.45)",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a1a1aa", letterSpacing: 1.2 }}>AETHER · ADMIN</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Predictive Churn Detection</div>
          </div>
        </div>
        <ScanButton secret={adminSecret} />
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>
        {/* ── Hero stats ─────────────────────────────── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Critical risk"
              value={criticalCount}
              sub={`${pct(criticalCount, totalUsers)}% of base`}
              accent="#ef4444"
              href={`/admin/churn?secret=${encodeURIComponent(adminSecret)}&tier=CRITICAL`}
            />
            <KpiCard
              icon={<Activity className="h-4 w-4" />}
              label="High risk"
              value={highCount}
              sub={`${pct(highCount, totalUsers)}% of base`}
              accent="#f97316"
              href={`/admin/churn?secret=${encodeURIComponent(adminSecret)}&tier=HIGH`}
            />
            <KpiCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Revenue at risk"
              value={`$${(csmRevenueAtRisk / 100).toLocaleString()}/mo`}
              sub="paying users in CRITICAL or HIGH"
              accent="#7c3aed"
            />
            <KpiCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Healthy users"
              value={healthyCount}
              sub={`${pct(healthyCount, totalUsers)}% of base`}
              accent="#10b981"
              href={`/admin/churn?secret=${encodeURIComponent(adminSecret)}&tier=HEALTHY`}
            />
          </div>
        </section>

        {/* ── Distribution + cost ─────────────────── */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <DistributionBar
            secret={adminSecret}
            critical={criticalCount}
            high={highCount}
            medium={mediumCount}
            low={lowCount}
            healthy={healthyCount}
          />
          <Card>
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8, letterSpacing: 0.8 }}>
              AI SPEND · LAST 30 DAYS
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              ${((costAgg._sum.costCents ?? 0) / 100).toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              {costAgg._count.toLocaleString()} predictions ·{" "}
              {((costAgg._sum.tokensIn ?? 0) + (costAgg._sum.tokensOut ?? 0)).toLocaleString()} tokens
            </div>
            <div
              style={{
                marginTop: 14, padding: "8px 10px", borderRadius: 8,
                background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.30)",
                fontSize: 11, color: "#c4b5fd",
              }}
            >
              ~$
              {totalUsers > 0
                ? (((costAgg._sum.costCents ?? 0) / 100) / Math.max(totalUsers, 1)).toFixed(4)
                : "0.0000"}
              {" "}per user · powered by gpt-4o-mini
            </div>
          </Card>
        </section>

        {/* ── Tier filter chips ────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <FilterChip label={`All ${analyzedCount}`} href={`/admin/churn?secret=${encodeURIComponent(adminSecret)}`} active={!activeTier} />
          {validTiers.map(t => {
            const count = t === "CRITICAL" ? criticalCount : t === "HIGH" ? highCount : t === "MEDIUM" ? mediumCount : t === "LOW" ? lowCount : healthyCount;
            return (
              <FilterChip
                key={t}
                label={`${churnTierLabel(t)} ${count}`}
                href={`/admin/churn?secret=${encodeURIComponent(adminSecret)}&tier=${t}`}
                active={activeTier === t}
                accent={churnTierColor(t).dot}
              />
            );
          })}
        </div>

        {/* ── User list ────────────────────────── */}
        {users.length === 0 ? (
          <EmptyState secret={adminSecret} hasAnalyzed={analyzedCount > 0} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map(u => {
              const p = latestById.get(u.id);
              const tier = (u.churnRiskTier ?? "HEALTHY") as ChurnTier;
              const colors = churnTierColor(tier);
              const redFlags = parseStringArray(p?.redFlags);
              const greenFlags = parseStringArray(p?.greenFlags);
              const saveType = p?.saveActionType ?? "none";
              const priority = p?.savePriority ?? "low";
              return (
                <article
                  key={u.id}
                  style={{
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${colors.border}`,
                    padding: "16px 20px",
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                      <RiskScoreOrb score={u.churnRiskScore ?? 0} tier={tier} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.name || u.email}
                        </div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", display: "flex", gap: 10, marginTop: 2 }}>
                          <span>{u.email}</span>
                          <span style={{ color: "#52525b" }}>•</span>
                          <PlanBadge plan={u.plan} />
                          <span style={{ color: "#52525b" }}>•</span>
                          <span>Joined {ago(u.createdAt)}</span>
                          {u.planRenewsAt && (
                            <>
                              <span style={{ color: "#52525b" }}>•</span>
                              <span>Renews {ago(u.planRenewsAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <TierBadge tier={tier} />
                      <PriorityBadge priority={priority} />
                    </div>
                  </div>

                  {/* AI reasoning */}
                  {p?.reasoning && (
                    <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.55, color: "#e4e4e7" }}>
                      {p.reasoning}
                    </p>
                  )}

                  {/* Flags */}
                  {(redFlags.length > 0 || greenFlags.length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {redFlags.map((s, i) => (
                        <span key={`r-${i}`} style={flagPill("#ef4444")}>
                          <span style={{ fontWeight: 700, marginRight: 6 }}>⚠</span>{s}
                        </span>
                      ))}
                      {greenFlags.map((s, i) => (
                        <span key={`g-${i}`} style={flagPill("#10b981")}>
                          <span style={{ fontWeight: 700, marginRight: 6 }}>✓</span>{s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Save action */}
                  {p?.saveAction && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(124,58,237,0.08)",
                        border: "1px solid rgba(124,58,237,0.28)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <SaveActionIcon type={saveType} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#c4b5fd", letterSpacing: 0.8, marginBottom: 4 }}>
                          RECOMMENDED PLAY
                        </div>
                        <div style={{ fontSize: 13.5, color: "#fff", fontWeight: 600 }}>
                          {p.saveAction}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4" style={{ color: "#a78bfa", flexShrink: 0, marginTop: 2 }} />
                    </div>
                  )}

                  {/* Predicted-at footer */}
                  <div style={{ marginTop: 12, fontSize: 11, color: "#52525b", display: "flex", justifyContent: "space-between" }}>
                    <span>Analyzed {ago(u.churnPredictedAt)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      Score {u.churnRiskScore ?? 0}/100
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, accent, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${accent}33`,
        borderRadius: 14,
        padding: "16px 18px",
        transition: "transform 0.15s, border-color 0.15s",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, color: "#a1a1aa", letterSpacing: 1, textTransform: "uppercase" }}>
          {label}
        </span>
        <span
          style={{
            width: 26, height: 26, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${accent}1f`, color: accent,
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#71717a", marginTop: 4 }}>{sub}</div>
    </div>
  );
  return href ? <Link href={href} style={{ display: "block", textDecoration: "none" }}>{inner}</Link> : inner;
}

function DistributionBar({
  secret, critical, high, medium, low, healthy,
}: {
  secret: string;
  critical: number; high: number; medium: number; low: number; healthy: number;
}) {
  const total = Math.max(critical + high + medium + low + healthy, 1);
  const seg = (n: number, color: string, tier: ChurnTier) => ({
    flex: n / total,
    color,
    tier,
    n,
  });
  const segs = [
    seg(critical, "#ef4444", "CRITICAL"),
    seg(high,     "#f97316", "HIGH"),
    seg(medium,   "#f59e0b", "MEDIUM"),
    seg(low,      "#7c3aed", "LOW"),
    seg(healthy,  "#10b981", "HEALTHY"),
  ];
  return (
    <Card>
      <div style={{ fontSize: 11, color: "#71717a", marginBottom: 10, letterSpacing: 0.8 }}>
        RISK DISTRIBUTION
      </div>
      <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
        {segs.map((s, i) =>
          s.flex > 0 ? (
            <Link
              key={i}
              href={`/admin/churn?secret=${encodeURIComponent(secret)}&tier=${s.tier}`}
              style={{
                flex: s.flex,
                background: s.color,
                cursor: "pointer",
              }}
              title={`${churnTierLabel(s.tier)}: ${s.n}`}
            />
          ) : null,
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#a1a1aa", flexWrap: "wrap", gap: 6 }}>
        {segs.map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
            {churnTierLabel(s.tier)} <strong style={{ color: "#fff" }}>{s.n}</strong>
          </span>
        ))}
      </div>
    </Card>
  );
}

function FilterChip({
  label, href, active, accent,
}: { label: string; href: string; active: boolean; accent?: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: "none",
        background: active
          ? (accent ? `${accent}1f` : "rgba(124,58,237,0.18)")
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${active
          ? (accent ?? "rgba(124,58,237,0.55)")
          : "rgba(255,255,255,0.08)"}`,
        color: active ? "#fff" : "#a1a1aa",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {accent && <span style={{ width: 7, height: 7, borderRadius: 999, background: accent }} />}
      {label}
    </Link>
  );
}

function RiskScoreOrb({ score, tier }: { score: number; tier: ChurnTier }) {
  const colors = churnTierColor(tier);
  return (
    <div
      style={{
        width: 48, height: 48, borderRadius: 12,
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.dot}33, ${colors.dot}0a)`,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 24px ${colors.dot}1f`,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 800, color: colors.fg }}>
        {score}
      </span>
    </div>
  );
}

function TierBadge({ tier }: { tier: ChurnTier }) {
  const c = churnTierColor(tier);
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      {tier}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, [string, string]> = {
    urgent: ["#fca5a5", "rgba(239,68,68,0.12)"],
    high:   ["#fdba74", "rgba(249,115,22,0.12)"],
    normal: ["#a1a1aa", "rgba(255,255,255,0.04)"],
    low:    ["#71717a", "rgba(255,255,255,0.02)"],
  };
  const [fg, bg] = map[priority] || map.normal;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        background: bg,
        color: fg,
        border: `1px solid ${fg}33`,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {priority}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const p = (plan || "FREE").toUpperCase();
  const accent =
    p === "SCALE"   ? "#a78bfa" :
    p === "GROWTH"  ? "#67e8f9" :
    p === "STARTER" ? "#34d399" :
    "#71717a";
  return (
    <span style={{ color: accent, fontWeight: 600 }}>{p}</span>
  );
}

function SaveActionIcon({ type }: { type: string }) {
  const sz = { width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,58,237,0.18)", color: "#c4b5fd" };
  if (type === "email")    return <div style={sz}><Mail className="h-4 w-4" /></div>;
  if (type === "call")     return <div style={sz}><Phone className="h-4 w-4" /></div>;
  if (type === "discount") return <div style={sz}><Percent className="h-4 w-4" /></div>;
  if (type === "tutorial") return <div style={sz}><BookOpen className="h-4 w-4" /></div>;
  return <div style={sz}><ArrowRight className="h-4 w-4" /></div>;
}

function EmptyState({ secret, hasAnalyzed }: { secret: string; hasAnalyzed: boolean }) {
  return (
    <Card style={{ textAlign: "center", padding: 48 }}>
      <Users className="h-8 w-8 mx-auto mb-3" style={{ color: "#52525b" }} />
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
        {hasAnalyzed ? "No users in this tier" : "No predictions yet"}
      </h3>
      <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 16 }}>
        {hasAnalyzed
          ? "Try a different filter, or run a new scan to refresh predictions."
          : "Run your first scan to populate churn predictions across the user base."}
      </p>
      <ScanButton secret={secret} />
    </Card>
  );
}

function ScanButton({ secret }: { secret: string }) {
  // Server Action style — uses fetch in the browser. We render a tiny inline form
  // that POSTs to the API and refreshes the page. Plain HTML — no client JS lib.
  return (
    <form action={`/api/admin/churn?action=scan&secret=${encodeURIComponent(secret)}&max=500&c=5`} method="POST" style={{ display: "inline-block" }}>
      <button
        type="submit"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 10,
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(124,58,237,0.40)",
        }}
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Run scan now
      </button>
    </form>
  );
}

function flagPill(color: string): CSSProperties {
  return {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11.5,
    background: `${color}14`,
    color: color === "#ef4444" ? "#fca5a5" : "#6ee7b7",
    border: `1px solid ${color}44`,
    display: "inline-flex",
    alignItems: "center",
  };
}

function parseStringArray(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const j = JSON.parse(v);
    return Array.isArray(j) ? j.filter((s: unknown): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function ago(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = Date.now() - date.getTime();
  const min = Math.floor(Math.abs(ms) / 60000);
  const future = ms < 0;
  if (min < 1)  return future ? "soon"          : "just now";
  if (min < 60) return future ? `in ${min}m`    : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return future ? `in ${hr}h`     : `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30)return future ? `in ${days}d`   : `${days}d ago`;
  return date.toLocaleDateString();
}

function pct(n: number, total: number): string {
  if (total <= 0) return "0";
  return ((n / total) * 100).toFixed(1);
}
