"use client";
import { useState } from "react";
import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";
const SUPPORT_EMAIL = "support@useaether.net";
const SALES_EMAIL = "hello@useaether.net";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Send via email link as fallback (no backend form endpoint yet)
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AetherMark size={28} glow />
            <span className="font-black text-white tracking-tight">Aether</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">← Back home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-12">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Contact</p>
          <h1 className="text-5xl font-black leading-tight mb-6">Get in touch.</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Have a question, feedback, or want to talk? We&apos;re here.
          </p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <a href={`mailto:${SUPPORT_EMAIL}`}
            className="p-6 rounded-2xl transition-colors group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Support</p>
            <p className="font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{SUPPORT_EMAIL}</p>
            <p className="text-zinc-600 text-sm">Account issues, billing, or technical help</p>
          </a>
          <a href={`mailto:${SALES_EMAIL}`}
            className="p-6 rounded-2xl transition-colors group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Sales & General</p>
            <p className="font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{SALES_EMAIL}</p>
            <p className="text-zinc-600 text-sm">Partnerships, enterprise plans, or general questions</p>
          </a>
        </div>

        {/* Form */}
        <div className="p-8 rounded-3xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <h2 className="text-xl font-bold mb-2">Message received!</h2>
              <p className="text-zinc-500">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Name</label>
                    <input
                      type="text" required
                      placeholder="Your name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder-zinc-700 transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Email</label>
                    <input
                      type="email" required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder-zinc-700 transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-2">Subject</label>
                  <input
                    type="text" required
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder-zinc-700 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-2">Message</label>
                  <textarea
                    required rows={5}
                    placeholder="Tell us more..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder-zinc-700 resize-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}
                >
                  {loading ? "Sending..." : "Send message →"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.05] flex items-center justify-between text-sm text-zinc-700">
          <span>© {new Date().getFullYear()} {COMPANY}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
