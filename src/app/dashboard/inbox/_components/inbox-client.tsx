"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Flame,
  Pin,
  PinOff,
  Copy,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Inbox as InboxIcon,
} from "lucide-react";
import { intentColor, intentLabel, type ReplyIntent } from "@/lib/reply-intelligence";

type ReplyLite = {
  id: string;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  intent: string;
  sentiment: string;
  urgency: string;
  score: number;
  summary: string;
  suggestedAction: string;
  tags: string[];
  status: string;
  pinned: boolean;
  hot: boolean;
  receivedAt: string;
  actionedAt: string | null;
  repliedAt: string | null;
};

const TAB_FILTERS: Array<{
  key: string;
  label: string;
  match: (r: ReplyLite) => boolean;
}> = [
  { key: "all",         label: "All",         match: () => true },
  { key: "hot",         label: "Hot",         match: (r) => r.hot && r.status !== "actioned" },
  { key: "interested",  label: "Interested",  match: (r) => r.intent === "INTERESTED" },
  { key: "question",    label: "Questions",   match: (r) => r.intent === "QUESTION" },
  { key: "objection",   label: "Objections",  match: (r) => r.intent === "OBJECTION" },
  { key: "actioned",    label: "Actioned",    match: (r) => r.status === "actioned" },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function InboxClient({ initialReplies }: { initialReplies: ReplyLite[] }) {
  const [replies, setReplies] = useState<ReplyLite[]>(initialReplies);
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const f = TAB_FILTERS.find((t) => t.key === tab) ?? TAB_FILTERS[0];
    const q = query.trim().toLowerCase();
    return replies.filter((r) => {
      if (!f.match(r)) return false;
      if (!q) return true;
      return (
        (r.fromEmail || "").toLowerCase().includes(q) ||
        (r.fromName || "").toLowerCase().includes(q) ||
        (r.subject || "").toLowerCase().includes(q) ||
        (r.summary || "").toLowerCase().includes(q)
      );
    });
  }, [replies, tab, query]);

  const updateOne = (id: string, patch: Partial<ReplyLite>) =>
    setReplies((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeOne = (id: string) =>
    setReplies((rs) => rs.filter((r) => r.id !== id));

  return (
    <div>
      {/* tabs + search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TAB_FILTERS.map((t) => {
            const count = replies.filter(t.match).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0"
                style={{
                  background: active
                    ? "rgba(124,58,237,0.18)"
                    : "rgba(255,255,255,0.02)",
                  color: active ? "#fff" : "#71717a",
                  border: `1px solid ${active ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                {t.label}
                <span
                  className="ml-1.5 px-1.5 py-0 rounded-md tabular-nums"
                  style={{
                    background: active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                    color: active ? "#c4b5fd" : "#52525b",
                    fontSize: 10,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by name, email, subject…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-sm pl-9 pr-3 py-2 rounded-lg w-full md:w-80 outline-none focus:border-violet-500/40 transition-colors"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          />
        </div>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <ReplyRow
              key={r.id}
              reply={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onUpdate={(patch) => updateOne(r.id, patch)}
              onRemove={() => removeOne(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl py-16 text-center"
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px dashed rgba(255,255,255,0.06)",
      }}
    >
      <InboxIcon className="h-8 w-8 mx-auto text-zinc-700 mb-3" />
      <div className="text-sm text-zinc-500">No replies match this filter yet.</div>
    </div>
  );
}

function ReplyRow({
  reply,
  open,
  onToggle,
  onUpdate,
  onRemove,
}: {
  reply: ReplyLite;
  open: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ReplyLite>) => void;
  onRemove: () => void;
}) {
  const col = intentColor(reply.intent as ReplyIntent);
  const fromLabel = reply.fromName || reply.fromEmail.split("@")[0];
  const initials = (reply.fromName || reply.fromEmail)[0]?.toUpperCase() || "?";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: reply.status === "new"
          ? "rgba(124,58,237,0.04)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${reply.hot
          ? "rgba(239,68,68,0.30)"
          : reply.status === "new"
          ? "rgba(124,58,237,0.20)"
          : "rgba(255,255,255,0.05)"}`,
        boxShadow: reply.hot ? "0 0 22px rgba(239,68,68,0.10)" : undefined,
      }}
    >
      {/* row header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.01] transition-colors"
      >
        {/* avatar */}
        <div
          className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-white text-sm relative"
          style={{
            background: `linear-gradient(135deg, ${col.fg}33, ${col.fg}11)`,
            border: `1px solid ${col.border}`,
            color: col.fg,
          }}
        >
          {initials}
          {reply.hot && (
            <span
              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center"
              style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.55)" }}
            >
              <Flame className="h-2 w-2 text-white" />
            </span>
          )}
        </div>

        {/* center */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-sm font-semibold text-white truncate">{fromLabel}</div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: col.bg, color: col.fg, border: `1px solid ${col.border}` }}
            >
              {intentLabel(reply.intent as ReplyIntent)}
            </div>
            <div
              className="text-[10px] text-zinc-500 tabular-nums"
              title="AI score"
            >
              {reply.score}
            </div>
            {reply.urgency === "high" && (
              <div
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "#fb7185",
                  border: "1px solid rgba(239,68,68,0.30)",
                }}
              >
                Urgent
              </div>
            )}
            {reply.pinned && <Pin className="h-3 w-3 text-violet-400" />}
          </div>
          <div className="text-xs text-zinc-500 truncate">
            <span className="text-zinc-400">{reply.subject || "(no subject)"}</span>{" "}
            — {reply.summary}
          </div>
        </div>

        {/* right side meta */}
        <div className="text-[11px] text-zinc-600 shrink-0 tabular-nums">
          {timeAgo(reply.receivedAt)}
        </div>
        <div className="text-zinc-700">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* expanded detail */}
      {open && (
        <ExpandedDetail reply={reply} onUpdate={onUpdate} onRemove={onRemove} />
      )}
    </div>
  );
}

function ExpandedDetail({
  reply,
  onUpdate,
  onRemove,
}: {
  reply: ReplyLite;
  onUpdate: (patch: Partial<ReplyLite>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState<"none" | "redraft" | "send">("none");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<boolean>(reply.status === "actioned");
  const [, startTransition] = useTransition();

  // Lazy-load body + draft on first expand
  useMemo(() => {
    fetch(`/api/inbox/${reply.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.reply) {
          setDraft(d.reply.draftReply || "");
          setBody(d.reply.bodyText || "");
          if (d.reply.status === "read" && reply.status === "new") {
            onUpdate({ status: "read" });
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply.id]);

  async function redraft(tone: "warm" | "direct" | "formal" | "casual") {
    setLoading("redraft");
    setError(null);
    try {
      const res = await fetch(`/api/inbox/${reply.id}/redraft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "redraft failed");
      setDraft(d.reply.draftReply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "redraft failed");
    } finally {
      setLoading("none");
    }
  }

  async function patch(p: Partial<ReplyLite>) {
    onUpdate(p);
    await fetch(`/api/inbox/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).catch(() => {});
  }

  async function sendReply() {
    if (!draft || !draft.trim()) return;
    setLoading("send");
    setError(null);
    try {
      const res = await fetch(`/api/inbox/${reply.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "send failed");
      setSent(true);
      onUpdate({ status: "actioned", actionedAt: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "send failed");
    } finally {
      setLoading("none");
    }
  }

  async function dismiss() {
    startTransition(() => {
      onRemove();
    });
    await fetch(`/api/inbox/${reply.id}`, { method: "DELETE" }).catch(() => {});
  }

  function copyDraft() {
    if (!draft) return;
    navigator.clipboard?.writeText(draft).catch(() => {});
  }

  const intent = reply.intent as ReplyIntent;
  const col = intentColor(intent);

  return (
    <div
      className="px-4 pb-4 pt-1 grid md:grid-cols-2 gap-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* LEFT — what they said */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-1.5">
          What they said
        </div>
        <div
          className="rounded-xl p-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {body || (
            <span className="text-zinc-600 italic">Loading reply body…</span>
          )}
        </div>

        {/* AI summary + suggested action */}
        <div
          className="mt-3 rounded-xl p-3"
          style={{
            background: col.bg,
            border: `1px solid ${col.border}`,
          }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: col.fg }}>
            <Sparkles className="h-3 w-3" />
            AI take
          </div>
          <div className="text-sm text-white leading-snug mb-2">{reply.summary}</div>
          <div className="text-xs" style={{ color: col.fg }}>
            <span className="opacity-70">Suggested:</span> {reply.suggestedAction}
          </div>
        </div>

        {/* tags */}
        {reply.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reply.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "#a1a1aa",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* row actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionBtn onClick={() => patch({ pinned: !reply.pinned })} icon={reply.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}>
            {reply.pinned ? "Unpin" : "Pin"}
          </ActionBtn>
          <ActionBtn onClick={dismiss} icon={<X className="h-3.5 w-3.5" />}>
            Dismiss
          </ActionBtn>
          {!sent && (
            <ActionBtn
              onClick={() => patch({ status: "actioned", actionedAt: new Date().toISOString() })}
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Mark actioned
            </ActionBtn>
          )}
        </div>
      </div>

      {/* RIGHT — draft reply */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] uppercase tracking-widest text-zinc-600">
            AI-drafted reply
          </div>
          <div className="flex items-center gap-1">
            <ToneBtn label="warm" onClick={() => redraft("warm")} loading={loading === "redraft"} />
            <ToneBtn label="direct" onClick={() => redraft("direct")} loading={loading === "redraft"} />
            <ToneBtn label="formal" onClick={() => redraft("formal")} loading={loading === "redraft"} />
          </div>
        </div>
        <textarea
          value={draft ?? ""}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={draft === null ? "Loading…" : "(no draft — write your own)"}
          rows={9}
          className="w-full text-sm p-3 rounded-xl outline-none resize-y focus:border-violet-500/40 transition-colors"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#fff",
            minHeight: 180,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        />

        {error && (
          <div
            className="mt-2 text-xs px-3 py-2 rounded-lg"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.30)",
              color: "#fb7185",
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={copyDraft}
              className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#a1a1aa",
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={() => redraft("warm")}
              disabled={loading !== "none"}
              className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#a1a1aa",
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading === "redraft" ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>

          <button
            onClick={sendReply}
            disabled={sent || loading === "send" || !draft?.trim()}
            className="text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
            style={{
              background: sent
                ? "rgba(34,197,94,0.15)"
                : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: sent ? "#4ade80" : "#fff",
              border: sent
                ? "1px solid rgba(34,197,94,0.35)"
                : "1px solid rgba(124,58,237,0.5)",
              boxShadow: sent ? undefined : "0 0 18px rgba(124,58,237,0.32)",
            }}
          >
            {sent ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Sent
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {loading === "send" ? "Sending…" : "Send reply"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors hover:bg-white/[0.04]"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#a1a1aa",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ToneBtn({
  label,
  onClick,
  loading,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full disabled:opacity-50 transition-colors"
      style={{
        background: "rgba(124,58,237,0.08)",
        color: "#a78bfa",
        border: "1px solid rgba(124,58,237,0.18)",
      }}
    >
      {label}
    </button>
  );
}
