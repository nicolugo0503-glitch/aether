"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Send, HelpCircle } from "lucide-react";

const FAQ = [
  { keywords: ["agent", "create agent", "new agent", "make agent", "build agent"], question: "How do I create an agent?", answer: "Go to **AI Employees** → click **New Agent**. Give it a name, pick a role (SDR, Social, Email Marketer), connect your accounts, and hit **Deploy**. It'll start running tasks immediately." },
  { keywords: ["upgrade", "plan", "paid", "pro", "premium", "subscribe"], question: "How do I upgrade my plan?", answer: "Go to **Billing** in the sidebar → click **Upgrade Plan**. We support monthly and annual billing via Stripe. Your agents get more run credits and unlock advanced features instantly." },
  { keywords: ["instagram", "connect instagram", "ig", "facebook", "twitter", "x", "social account"], question: "How do I connect Instagram?", answer: "Go to **Settings** → **Integrations** → click **Connect** next to Instagram. You'll be redirected to authorize Aether. Once connected, your agents can post, reply, and DM on your behalf." },
  { keywords: ["run", "limit", "quota", "credits", "how many"], question: "What are the run limits?", answer: "Free plan: 50 runs/month. Pro: 500 runs/month. Business: unlimited. A \"run\" is one agent task execution — sending an email, posting to social, or completing a campaign step." },
  { keywords: ["api key", "openai", "key", "integration", "secret"], question: "How do I add API keys?", answer: "Go to **Settings** → **API Keys**. You can add your OpenAI key to power agents with GPT-4, or connect other integrations. Keys are encrypted and never exposed." },
  { keywords: ["campaign", "email campaign", "bulk email", "outreach"], question: "How do campaigns work?", answer: "Go to **Campaigns** → **New Campaign**. Write your email sequence, set timing rules, upload your contact list, and launch. Aether tracks opens, clicks, and replies in real time." },
  { keywords: ["overview", "dashboard", "stats", "home"], question: "What's on the Overview dashboard?", answer: "The **Overview** shows your total agents, runs this period, social posts published, active campaigns, and recent activity. It updates in real time." },
  { keywords: ["auto schedule", "automatic", "cron", "daily post", "auto post"], question: "How does auto-scheduling work?", answer: "In **Social Media** → **Auto Schedule** tab, toggle the switch on, set a time and frequency, and pick your platforms. Aether will automatically generate and post at that cadence." },
  { keywords: ["delete account", "delete", "account"], question: "How do I delete my account?", answer: "Go to **Settings** → scroll to the bottom → click **Delete Account**. This is permanent. Cancel your subscription in Billing first." },
  { keywords: ["help", "support", "contact", "issue", "problem", "bug"], question: "How do I get support?", answer: "Use this chat to get instant answers, or email us directly. Our team reviews all messages and responds quickly." },
  { keywords: ["what is aether", "what does aether do", "about", "how does it work"], question: "What is Aether?", answer: "Aether is an **AI workforce platform**. Create autonomous AI Employees (agents), run them on tasks, launch bulk email/outreach campaigns, and manage social media — all from one dashboard powered by large language models." },
];

const QUICK_TOPICS = [
  "How do I create an agent?",
  "How do I upgrade my plan?",
  "How do I connect Instagram?",
  "What are the run limits?",
  "How does auto-scheduling work?",
  "How do I add API keys?",
];

type Msg = { from: "bot" | "user"; text: string; id: number };
let msgId = 0;

function findAnswer(input: string): string {
  const q = input.toLowerCase();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => q.includes(k))) return entry.answer;
  }
  return "I'm not sure about that yet. Try emailing us directly — our team will get back to you quickly!";
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

const ACCENT = "#7c3aed";
export default function HelpPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "👋 Hi! I'm **Aether Assistant**. Ask me anything about the platform — agents, campaigns, billing, social media, and more.", id: msgId++ },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setShowQuick(false);
    setMessages((prev) => [...prev, { from: "user", text: trimmed, id: msgId++ }]);
    setTyping(true);
    setTimeout(() => {
      const answer = findAnswer(trimmed);
      setTyping(false);
      setMessages((prev) => [...prev, { from: "bot", text: answer, id: msgId++ }]);
    }, 600 + Math.random() * 400);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 130px)", maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        .hm-bot { animation: hmIn 0.18s ease; }
        @keyframes hmIn { from { opacity:0; transform: translateX(-8px); } to { opacity:1; transform: translateX(0); } }
        .hm-user { animation: hmInR 0.18s ease; }
        @keyframes hmInR { from { opacity:0; transform: translateX(8px); } to { opacity:1; transform: translateX(0); } }
        @keyframes typDot { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-4px); opacity:1; } }
        .hq-btn:hover { background: rgba(124,58,237,0.12) !important; border-color: rgba(124,58,237,0.35) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(124,58,237,0.45)", flexShrink: 0 }}>
          <HelpCircle size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Help & Support</div>
          <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Aether Assistant · usually replies instantly</div>
        </div>
        <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.from === "bot" ? "hm-bot" : "hm-user"} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {msg.from === "bot" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
            <div style={{ maxWidth: "78%", padding: "10px 13px", borderRadius: msg.from === "bot" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.from === "bot" ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, border: msg.from === "bot" ? "1px solid rgba(255,255,255,0.07)" : "none", fontSize: 13.5, lineHeight: 1.55, color: "#d4d4d8" }}>
              {renderBold(msg.text)}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "4px 16px 16px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#52525b", animation: `typDot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {showQuick && messages.length === 1 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Quick topics</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_TOPICS.map((t) => (
                <button key={t} onClick={() => sendMessage(t)} className="hq-btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 13px", fontSize: 12.5, color: "#a1a1aa", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>{t}</button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "4px 4px 4px 14px", alignItems: "center" }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask a question…" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#d4d4d8", fontFamily: "inherit", padding: "8px 0" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: input.trim() ? `linear-gradient(135deg, ${ACCENT}, #4f46e5)` : "rgba(255,255,255,0.06)", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
            <Send size={14} color={input.trim() ? "#fff" : "#3f3f46"} />
          </button>
        </div>
      </div>
    </div>
  );
}
