"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How long does it take to get started?",
    a: "Most teams are fully set up in under 10 minutes. Pick your AI employees, connect your channels (Google Sheets, Instagram, email), and your workforce starts running. No code, no technical setup, no consultants needed.",
  },
  {
    q: "Do I need to know how to code?",
    a: "Not at all. Aether is built for operators and marketers, not developers. Everything is point-and-click — choosing agents, writing prompts, connecting integrations, and scheduling runs. If you can use a spreadsheet, you can use Aether.",
  },
  {
    q: "What's the difference between a 'run' and a message sent?",
    a: "A run is one execution of an AI employee — for example, Ava generating and sending one cold email, or your social agent publishing one post. Each run counts as one use toward your monthly limit. Bulk campaign runs can process multiple contacts in a single run depending on your plan.",
  },
  {
    q: "Can I use my own AI agents with custom prompts?",
    a: "Yes. In addition to the four pre-built agents (Ava, Rex, Sage, Opus), you can create unlimited custom AI employees with any system prompt, role, and instructions you want. The custom agent builder is available on all paid plans.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never store your API keys in plaintext. Your leads, campaign data, and social content are never used to train any AI models. We're GDPR compliant and never share your data with third parties.",
  },
  {
    q: "What social platforms does Aether support?",
    a: "Aether currently supports Instagram, Facebook, and X (Twitter). Posts can include AI-generated images and captions. You can schedule posts on a daily, every-2-days, or weekly cadence, or trigger them manually.",
  },
  {
    q: "What happens when I hit my run limit?",
    a: "Your agents simply pause until your limit resets at the start of your next billing period. You'll see a usage gauge in your dashboard. You can upgrade at any time to get more runs immediately, or earn bonus runs by referring other teams.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts. Cancel from your dashboard settings in one click — your plan stays active through the end of the billing period and then stops. No questions asked, no retention calls.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're unsatisfied within the first 7 days of a paid plan, contact us and we'll issue a full refund. No hoops, no hassle.",
  },
  {
    q: "Is there a free trial?",
    a: "Our Free plan gives you 10 runs/month with one AI employee — permanently free, no credit card required. It's the best way to see what Aether can do before upgrading.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 md:py-40">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
            style={{ background: "rgba(124,58,237,0.05)" }}>
            FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
            Questions, <span className="gradient-text">answered.</span>
          </h2>
          <p className="text-zinc-500 text-lg">
            Everything you need to know before deploying your AI workforce.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: isOpen ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.02)",
                  border: isOpen ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}>
                  <span className="text-white font-semibold text-base leading-snug">{faq.q}</span>
                  <span className="shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: isOpen ? "#a78bfa" : "#52525b" }}>
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? 400 : 0 }}>
                  <p className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-zinc-600 text-sm mb-4">Still have questions?</p>
          <a href="/contact"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm font-semibold">
            Talk to us →
          </a>
        </div>
      </div>
    </section>
  );
}
