"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   FAQ knowledge base — keyword → answer
───────────────────────────────────────────── */
const FAQ: { keywords: string[]; question: string; answer: string }[] = [
  {
    keywords: ["agent", "employee", "create agent", "new agent", "ai employee"],
    question: "How do I create an AI Employee?",
    answer:
      "Go to **AI Employees** in the sidebar → click **New Agent** → fill in the role, system prompt, and model. Once saved, you can run the agent manually or hook it into a Campaign.",
  },
  {
    keywords: ["run", "execute", "start agent", "run agent", "trigger"],
    question: "How do I run an agent?",
    answer:
      "Open **AI Employees** → click an agent → hit **Run**. Type your input and submit. Results appear in **Runs** once complete. Every run counts toward your plan's monthly limit.",
  },
  {
    keywords: ["campaign", "bulk", "sheet", "google sheet", "email campaign"],
    question: "How do Campaigns work?",
    answer:
      "Campaigns let you run an agent across a list of contacts from a Google Sheet. Go to **Campaigns** → **New Campaign** → pick an agent, paste the Sheet URL, and launch. Results are saved automatically.",
  },
  {
    keywords: ["social", "instagram", "facebook", "twitter", "x ", "post", "schedule"],
    question: "How do I post to social media?",
    answer:
      "Go to **Social Media** → connect your accounts in **Settings** first (Facebook Page token, Instagram ID, X API keys). Then use **Generate & Post** to create AI captions, or **Schedule** to auto-post on a repeating schedule.",
  },
  {
    keywords: ["connect", "facebook", "instagram token", "page token", "fb token"],
    question: "How do I connect Facebook / Instagram?",
    answer:
      "Go to **Settings** → scroll to **Social Media**. Paste your **Facebook Page Access Token** and **Facebook Page ID**. Your Instagram business account linked to that page will be detected automatically.",
  },
  {
    keywords: ["twitter", "x api", "x keys", "twitter key"],
    question: "How do I connect X (Twitter)?",
    answer:
      "Go to **Settings** → **Social Media** section. You need four X / Twitter credentials: API Key, API Secret, Access Token, and Access Secret. Get them from the X Developer Portal at developer.twitter.com.",
  },
  {
    keywords: ["plan", "upgrade", "billing", "starter", "growth", "scale", "free"],
    question: "How do I upgrade my plan?",
    answer:
      "Go to **Billing** in the sidebar. You'll see the **Starter**, **Growth**, and **Scale** plans with run limits and prices. Click **Upgrade** on the plan you want — it opens Stripe's secure checkout.",
  },
  {
    keywords: ["limit", "run limit", "how many runs", "quota", "used"],
    question: "What are the plan run limits?",
    answer:
      "**Free**: 10 runs/month · **Starter**: 500 runs · **Growth**: 5,000 runs · **Scale**: 50,000 runs. Your current usage is shown on the **Billing** page and the **Overview** dashboard.",
  },
  {
    keywords: ["api key", "openai", "resend", "serper", "serp", "email api"],
    question: "Where do I add API keys?",
    answer:
      "Go to **Settings** → **API Keys** section. You can add your **OpenAI** key (used to run agents), **Resend** key (used for email campaigns), and **Serper** key (used for web search tools).",
  },
  {
    keywords: ["password", "change password", "reset password", "forgot"],
    question: "How do I change my password?",
    answer:
      "Go to **Settings** → **Security** section → enter your current password, then your new password twice, and click **Change Password**.",
  },
  {
    keywords: ["name", "change name", "profile", "display name", "update name"],
    question: "How do I change my display name?",
    answer:
      "Go to **Settings** → **Identity** section at the top → update your name and click **Save Profile**.",
  },
  {
    keywords: ["cancel", "subscription", "manage subscription", "portal"],
    question: "How do I manage or cancel my subscription?",
    answer:
      "Go to **Billing** → click **Manage Subscription**. This opens the Stripe customer portal where you can update payment, change plans, or cancel.",
  },
  {
    keywords: ["overview", "dashboard", "stats", "home"],
    question: "What's on the Overview dashboard?",
    answer:
      "The **Overview** shows your total agents, runs this period, social posts published, active campaigns, and recent activity. It updates in real time.",
  },
  {
    keywords: ["auto schedule", "automatic", "cron", "daily post", "auto post"],
    question: "How does auto-scheduling work for social?",
    answer:
      "In **Social Media** → **Auto Schedule** tab, toggle the switch on, set a time and frequency (daily / every 2 days / weekly), and pick your platforms. Aether will automatically generate and post at that cadence.",
  },
  {
    keywords: ["delete account", "delete", "account"],
    question: "How do I delete my account?",
    answer:
      "Go to **Settings** → scroll to the bottom → click **Delete Account**. This is permanent and removes all your data. Make sure to cancel your subscription in Billing first.",
  },
  {
    keywords: ["help", "support", "contact", "issue", "problem", "bug"],
    question: "How do I get support?",
    answer:
      "Use the **feedback button** (bottom-left of the dashboard) to send us a message. For urgent issues, email us directly — our team reviews all feedback and responds quickly.",
  },
  {
    keywords: ["what is aether", "what does aether do", "about", "how does it work"],
    question: "What is Aether?",
    answer:
      "Aether is an **AI workforce platform**. You create autonomous AI Employees (agents), run them on tasks, launch bulk email/outreach campaigns, and manage your social media — all from one dashboard powered by large language models.",
  },
];

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Msg = { from: "bot" | "user"; text: string; id: number };

/* ─────────────────────────────────────────────
   Keyword matcher
───────────────────────────────────────────── */
function findAnswer(input: string): string {
  const q = input.toLowerCase();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return entry.answer;
    }
  }
  return "I'm not sure about that yet. Try the **feedback button** on the bottom-left to send us your question and we'll add it! You can also browse these quick topics below ↓";
}

/* ─────────────────────────────────────────────
   Render markdown-ish bold (**text**)
───────────────────────────────────────────── */
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

/* ─────────────────────────────────────────────
   QUICK TOPIC buttons shown at start
───────────────────────────────────────────── */
const QUICK_TOPICS = [
  "How do I create an agent?",
  "How do I upgrade my plan?",
  "How do I connect Instagram?",
  "What are the run limits?",
  "How does auto-scheduling work?",
  "How do I add API keys?",
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const ACCENT = "#7c3aed";
const ACCENT_LIGHT = "#a78bfa";

let msgId = 0;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "👋 Hi! I'm **Aether Assistant**. Ask me anything about the platform — agents, campaigns, billing, social media, and more.",
      id: msgId++,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");

    const userMsg: Msg = { from: "user", text: trimmed, id: msgId++ };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    setTimeout(() => {
      const answer = findAnswer(trimmed);
      setTyping(false);
      setMessages((prev) => [...prev, { from: "bot", text: answer, id: msgId++ }]);
    }, 600 + Math.random() * 400);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── BUBBLE ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat support"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9998,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 24px rgba(124,58,237,0.5), 0 0 0 ${open ? "3px" : "0px"} rgba(124,58,237,0.35)`,
          transition: "box-shadow 0.2s, transform 0.2s",
          transform: open ? "scale(1.08)" : "scale(1)",
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── PANEL ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            zIndex: 9997,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 20,
            background: "rgba(8,8,16,0.97)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backdropFilter: "blur(24px)",
            animation: "chatSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <style>{`
            @keyframes chatSlideUp {
              from { opacity:0; transform: translateY(16px) scale(0.96); }
              to   { opacity:1; transform: translateY(0) scale(1); }
            }
            .chat-msg-bot { animation: chatMsgIn 0.18s ease; }
            @keyframes chatMsgIn {
              from { opacity:0; transform: translateX(-8px); }
              to   { opacity:1; transform: translateX(0); }
            }
            .chat-msg-user { animation: chatMsgInR 0.18s ease; }
            @keyframes chatMsgInR {
              from { opacity:0; transform: translateX(8px); }
              to   { opacity:1; transform: translateX(0); }
            }
            .chat-input:focus { outline: none; }
            .chat-quick:hover { background: rgba(124,58,237,0.18) !important; border-color: rgba(124,58,237,0.4) !important; }
          `}</style>

          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: `0 0 14px rgba(124,58,237,0.45)`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Aether Assistant</div>
              <div style={{ fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Online · Always here
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            scrollbarWidth: "none",
          }}>
            {messages.map((msg) =>
              msg.from === "bot" ? (
                <div key={msg.id} className="chat-msg-bot" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{
                    maxWidth: "82%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px 14px 14px 4px",
                    padding: "10px 13px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#d4d4d8",
                  }}>
                    {renderBold(msg.text)}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="chat-msg-user" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    maxWidth: "80%",
                    background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                    borderRadius: "14px 14px 4px 14px",
                    padding: "10px 13px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#fff",
                    fontWeight: 500,
                  }}>
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-msg-bot" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "12px 16px",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: ACCENT_LIGHT, opacity: 0.7,
                      animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                      display: "inline-block",
                    }} />
                  ))}
                  <style>{`
                    @keyframes typingDot {
                      0%,60%,100% { transform: translateY(0); opacity: 0.5; }
                      30% { transform: translateY(-5px); opacity: 1; }
                    }
                  `}</style>
                </div>
              </div>
            )}

            {/* Quick topics — show only when 1 message (initial) */}
            {messages.length === 1 && !typing && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#52525b", marginBottom: 8, paddingLeft: 34 }}>
                  QUICK TOPICS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 34 }}>
                  {QUICK_TOPICS.map((t) => (
                    <button
                      key={t}
                      className="chat-quick"
                      onClick={() => sendMessage(t)}
                      style={{
                        background: "rgba(124,58,237,0.08)",
                        border: "1px solid rgba(124,58,237,0.2)",
                        borderRadius: 10,
                        padding: "7px 12px",
                        fontSize: 12,
                        color: ACCENT_LIGHT,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                        fontFamily: "inherit",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about Aether…"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "9px 13px",
                fontSize: 13,
                color: "#fff",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "none",
                background: input.trim() && !typing
                  ? `linear-gradient(135deg, ${ACCENT}, #4f46e5)`
                  : "rgba(255,255,255,0.05)",
                cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                  stroke={input.trim() && !typing ? "white" : "#52525b"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
