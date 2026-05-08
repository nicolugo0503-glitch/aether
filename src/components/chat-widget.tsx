"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What can Aether do?",
  "How much does it cost?",
  "How do I get started?",
  "Can it post to Instagram?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) setShowSuggestions(true);
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.5)",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open
          ? <X className="h-5 w-5 text-white" />
          : <MessageCircle className="h-5 w-5 text-white" />
        }
      </button>

      {/* Chat window */}
      <div
        className="fixed bottom-24 right-6 z-50 flex flex-col"
        style={{
          width: "min(380px, calc(100vw - 24px))",
          height: "min(520px, calc(100vh - 160px))",
          background: "#09090c",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="relative">
            <AetherMark size={32} glow />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#09090c]" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Aria</p>
            <p className="text-xs text-emerald-400">Aether AI · Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>

          {/* Welcome */}
          {messages.length === 0 && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <AetherMark size={16} />
              </div>
              <div className="flex-1">
                <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-zinc-200 leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Hi! I&apos;m Aria, Aether&apos;s AI assistant. Ask me anything about Aether — pricing, features, how to get started, or anything else. 👋
                </div>
              </div>
            </div>
          )}

          {/* Suggestion chips */}
          {showSuggestions && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <AetherMark size={16} />
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", borderRadius: "16px 16px 4px 16px" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", color: "#e4e4e7", borderRadius: "16px 16px 16px 4px" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <AetherMark size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl text-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] flex-shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </form>
          <p className="text-center text-xs text-zinc-700 mt-2">Powered by Aether AI</p>
        </div>
      </div>
    </>
  );
}
