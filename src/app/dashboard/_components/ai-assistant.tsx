"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

interface Msg { id: string; role: "user" | "ai"; text: string; streaming?: boolean; }

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "0", role: "ai", text: "Hey! I'm Aria, your Aether AI assistant. Ask me anything about features, pricing, or getting set up." },
  ]);
  const [input, setInput]     = useState("");
  const [busy, setBusy]       = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userText = input.trim();
    setInput("");
    setBusy(true);

    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: userText };
    setMsgs(p => [...p, userMsg]);

    const aiId = (Date.now() + 1).toString();
    setMsgs(p => [...p, { id: aiId, role: "ai", text: "", streaming: true }]);

    try {
      const history = msgs
        .filter(m => m.role === "user" || (m.role === "ai" && m.id !== "0"))
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      history.push({ role: "user", content: userText });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply: string = data.reply || "Sorry, something went wrong. Try again or email support@useaether.net.";

      // Simulate streaming by typing out the reply
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setMsgs(p => p.map(m => m.id === aiId ? { ...m, text: reply.slice(0, i) } : m));
        if (i >= reply.length) {
          clearInterval(iv);
          setMsgs(p => p.map(m => m.id === aiId ? { ...m, streaming: false } : m));
          setBusy(false);
        }
      }, 12);
    } catch {
      setMsgs(p => p.map(m => m.id === aiId
        ? { ...m, text: "Connection error. Please try again.", streaming: false }
        : m));
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 8500 }}>
      {open && (
        <div
          style={{ position: "absolute", bottom: 66, right: 0, width: 330, background: "rgba(8,4,18,0.98)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 18, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.75), 0 0 60px rgba(124,58,237,0.08)", animation: "chatIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,58,237,0.08)" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Aether AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#a78bfa" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulseDot 2s infinite" }} />
                Always online
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex", padding: 4 }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ height: 250, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "88%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "3px 12px 12px 12px", background: m.role === "user" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.06)", fontSize: 12, color: "#fff", lineHeight: 1.55 }}>
                  {m.text}
                  {m.streaming && <span style={{ display: "inline-block", width: 2, height: 11, background: "#a78bfa", marginLeft: 2, verticalAlign: "middle", animation: "blinkCursor 0.75s infinite" }} />}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 7, padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask anything..."
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 11px", fontSize: 12, color: "#fff", outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || busy}
              style={{ width: 34, height: 34, borderRadius: 10, background: input.trim() && !busy ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.05)", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: input.trim() ? "0 0 12px rgba(124,58,237,0.35)" : "none" }}
            >
              <Send size={13} color={input.trim() && !busy ? "#fff" : "#52525b"} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: 52, height: 52, borderRadius: "50%", background: open ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", border: open ? "1px solid rgba(255,255,255,0.12)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: open ? "none" : "0 0 22px rgba(124,58,237,0.55), 0 0 44px rgba(124,58,237,0.2)", transition: "all 0.2s" }}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={20} color="#fff" />}
      </button>

      <style>{`
        @keyframes chatIn { from { opacity:0; transform:translateY(14px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
