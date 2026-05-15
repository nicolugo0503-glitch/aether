import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Inbox,
  Flame,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { intentColor, intentLabel, type ReplyIntent } from "@/lib/reply-intelligence";
import { InboxClient } from "./_components/inbox-client";

export const dynamic = "force-dynamic";

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

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [replies, counts, lastWeekActioned] = await Promise.all([
    prisma.emailReply
      .findMany({
        where: { userId: user.id, status: { not: "dismissed" } },
        orderBy: [{ pinned: "desc" }, { receivedAt: "desc" }],
        take: 100,
        select: {
          id: true, fromEmail: true, fromName: true, subject: true,
          intent: true, sentiment: true, urgency: true, score: true,
          summary: true, suggestedAction: true, tags: true,
          status: true, pinned: true, hot: true,
          receivedAt: true, actionedAt: true, repliedAt: true,
        },
      })
      .catch(() => []),
    prisma.emailReply
      .groupBy({
        by: ["intent"],
        where: { userId: user.id, status: { not: "dismissed" } },
        _count: { _all: true },
      })
      .catch(() => [] as Array<{ intent: string; _count: { _all: number } }>),
    prisma.emailReply
      .count({
        where: {
          userId: user.id,
          status: "actioned",
          actionedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => 0),
  ]);

  const totalReplies = replies.length;
  const newReplies = replies.filter((r) => r.status === "new").length;
  const hotReplies = replies.filter((r) => r.hot && r.status !== "actioned").length;
  const interestedReplies = replies.filter(
    (r) => r.intent === "INTERESTED" && r.status !== "actioned",
  ).length;

  const replyRate = totalReplies > 0
    ? Math.round(
        (replies.filter((r) => r.intent === "HOT" || r.intent === "INTERESTED").length /
          totalReplies) * 100,
      )
    : 0;

  // Token + webhook URL — used by setup banner if there are no replies yet
  const dbUser = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: { inboxWebhookToken: true, inboxNotifyHot: true },
    })
    .catch(() => null);

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
            <Inbox className="h-5 w-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Smart Inbox
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,58,237,0.14)",
                  color: "#a78bfa",
                  border: "1px solid rgba(124,58,237,0.30)",
                }}
              >
                AI
              </span>
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Every inbound reply auto-classified, scored, and pre-drafted by GPT — so you only spend
              your time on the ones that move revenue.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard
            label="Hot replies"
            value={hotReplies}
            icon={<Flame className="h-3.5 w-3.5" />}
            accent={hotReplies > 0 ? "#fb7185" : "#52525b"}
            sub={hotReplies > 0 ? "needs response now" : "all caught up"}
          />
          <StatCard
            label="Interested"
            value={interestedReplies}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            accent="#4ade80"
            sub="ready for nurture"
          />
          <StatCard
            label="New today"
            value={newReplies}
            icon={<Inbox className="h-3.5 w-3.5" />}
            accent="#a78bfa"
            sub="unread"
          />
          <StatCard
            label="Replied this week"
            value={lastWeekActioned}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            accent="#22c55e"
            sub={replyRate > 0 ? `${replyRate}% positive intent` : "—"}
          />
        </div>
      </div>

      {/* ── Empty / setup state ────────────────────────── */}
      {totalReplies === 0 && (
        <SetupBanner
          token={dbUser?.inboxWebhookToken ?? null}
          notifyHot={dbUser?.inboxNotifyHot ?? true}
        />
      )}

      {/* ── Intent distribution chip strip ─────────────── */}
      {totalReplies > 0 && counts.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(counts as Array<{ intent: string; _count: { _all: number } }>)
            .sort((a, b) => b._count._all - a._count._all)
            .map((c) => {
              const intent = c.intent as ReplyIntent;
              const col = intentColor(intent);
              return (
                <div
                  key={intent}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2"
                  style={{ background: col.bg, color: col.fg, border: `1px solid ${col.border}` }}
                >
                  <span>{intentLabel(intent)}</span>
                  <span style={{ opacity: 0.7 }}>{c._count._all}</span>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Inbox list (client-side interactive) ───────── */}
      <InboxClient initialReplies={replies.map((r) => ({
        ...r,
        receivedAt: r.receivedAt.toISOString(),
        actionedAt: r.actionedAt ? r.actionedAt.toISOString() : null,
        repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
        tags: (() => { try { return JSON.parse(r.tags) as string[]; } catch { return [] as string[]; } })(),
      }))} />

      {/* ── Footer help link ──────────────────────────── */}
      <div className="mt-10 text-center text-xs text-zinc-600">
        Need to forward your real inbox into Aether?{" "}
        <Link
          href="/dashboard/settings"
          className="underline decoration-dotted hover:text-zinc-400 transition-colors"
        >
          View setup instructions →
        </Link>
      </div>
    </div>
  );
}

/* ── inline helpers ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest mb-2"
        style={{ color: accent }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-3xl font-black text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}

function SetupBanner({
  token,
  notifyHot,
}: {
  token: string | null;
  notifyHot: boolean;
}) {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://useaether.ai";
  const webhookUrl = token
    ? `${base.replace(/\/$/, "")}/api/inbox/inbound?token=${token}`
    : null;

  return (
    <div
      className="rounded-2xl p-6 mb-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.02))",
        border: "1px solid rgba(124,58,237,0.22)",
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(124,58,237,0.18)",
            border: "1px solid rgba(124,58,237,0.30)",
          }}
        >
          <TrendingUp className="h-4 w-4" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <div className="text-white font-bold text-base">
            Connect your reply stream to start triaging
          </div>
          <div className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Aether listens at one endpoint and classifies every reply with GPT-4o-mini in ~1s.
            Forward replies from <span className="text-zinc-300">Resend Inbound</span>,{" "}
            <span className="text-zinc-300">SendGrid Parse</span>,{" "}
            <span className="text-zinc-300">Postmark</span>, or pipe via Zapier / Make.
          </div>
        </div>
      </div>

      {webhookUrl ? (
        <div
          className="rounded-xl p-3 text-xs font-mono break-all"
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#a78bfa",
          }}
        >
          {webhookUrl}
        </div>
      ) : (
        <div className="text-xs text-zinc-500">
          Visit <code className="text-violet-300">GET /api/inbox/token</code> to issue your unique
          webhook URL — or just refresh this page.
        </div>
      )}

      <div className="mt-4 text-[11px] text-zinc-600 flex flex-wrap gap-x-4 gap-y-1">
        <span>• POST JSON: <code className="text-zinc-400">{"{ from, subject, text }"}</code></span>
        <span>• Or use <code className="text-zinc-400">Authorization: Bearer &lt;token&gt;</code></span>
        <span>• Hot-reply email alerts: {notifyHot ? "✓ on" : "off"}</span>
      </div>
    </div>
  );
}
