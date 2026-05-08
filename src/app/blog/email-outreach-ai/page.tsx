import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

export const metadata = {
  title: "Why AI-Powered Cold Email Still Works in 2025 | Aether",
  description: "Cold email isn't dead — bad cold email is. Here's how AI is making outreach more personal, not less, and what that means for your sales pipeline.",
};

export default function Post3() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AetherMark size={28} glow />
            <span className="font-black text-white tracking-tight">Aether</span>
          </Link>
          <Link href="/blog" className="text-sm text-zinc-500 hover:text-white transition-colors">← Blog</Link>
        </div>
      </nav>

      <article className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(8,145,178,0.12)", color: "#67e8f9", border: "1px solid rgba(8,145,178,0.25)" }}>Email Marketing</span>
            <span className="text-zinc-600 text-sm">April 17, 2025 · 7 min read</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-5">Why AI-Powered Cold Email Still Works in 2025</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">Cold email isn't dead — bad cold email is. Here's how AI is making outreach more personal, not less, and what that means for your pipeline.</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">

          <p>"Cold email is dead." You've heard it. It's been said every year since 2015. And every year, companies still close deals through cold email — because the ones who do it well keep doing it well.</p>

          <p>What's dead is <em>bad</em> cold email. The "Hi [First Name], I noticed you work at [Company]" template blasts that nobody reads. AI doesn't revive that. But it does something more interesting: it makes <em>genuine</em> personalization possible at scale.</p>

          <h2 className="text-2xl font-black text-white mt-10 mb-4">The personalization paradox</h2>

          <p>Real personalization — the kind that actually gets replies — takes time. A good SDR might spend 15–20 minutes researching each prospect before writing an email. They look at the company's recent news, the prospect's LinkedIn activity, the company's product, their hiring patterns.</p>

          <p>That level of research limits how many emails a human can send in a day. It's a tradeoff: quality vs. volume. Most teams pick volume and sacrifice quality. Then they wonder why the reply rate is 0.5%.</p>

          <p>AI SDRs break this tradeoff. An agent can research 500 companies in the time it takes a human to research 5 — and then write a personalized opening line for each one that references something specific and real.</p>

          <h2 className="text-2xl font-black text-white mt-10 mb-4">What makes a cold email actually good</h2>

          <p>After analyzing thousands of cold emails, the pattern is consistent. High-performing cold emails share four traits:</p>

          <ul className="space-y-3 pl-6 list-disc text-zinc-400 mt-4">
            <li><strong className="text-white">A specific first line</strong> — something that proves you did your homework. Not "I noticed you're in SaaS." More like "Saw that you just launched a new pricing page — curious if you're testing conversion."</li>
            <li><strong className="text-white">One clear problem</strong> — not a feature list. What specific pain are you solving?</li>
            <li><strong className="text-white">Social proof that's relevant</strong> — not "we work with Fortune 500 companies" but "we helped a team your size cut their SDR hours by 60%."</li>
            <li><strong className="text-white">A frictionless CTA</strong> — "Open to a quick call?" outperforms "Would you be interested in scheduling a 30-minute demo at your earliest convenience?"</li>
          </ul>

          <p className="mt-4">An AI SDR trained on your product, your ICP, and examples of your best-performing emails can apply all four of these consistently — across thousands of emails.</p>

          <h2 className="text-2xl font-black text-white mt-10 mb-4">The right workflow: AI does the research, you do the strategy</h2>

          <p>The best results come from treating your AI SDR as a highly capable junior rep, not a magic button. Here's the workflow that consistently produces results:</p>

          <ol className="space-y-3 pl-6 list-decimal text-zinc-400 mt-4">
            <li><strong className="text-white">You define the ICP</strong> — industry, company size, job title, trigger events</li>
            <li><strong className="text-white">You build the list</strong> — leads that fit the profile</li>
            <li><strong className="text-white">AI does the research and writing</strong> — personalized first lines, full email drafts</li>
            <li><strong className="text-white">You review a sample</strong> — spot-check 10% to make sure quality is there</li>
            <li><strong className="text-white">AI sends at scale</strong> — with your sending domain and signature</li>
          </ol>

          <p className="mt-4">This workflow turns a one-person sales operation into something that punches well above its weight class.</p>

          <h2 className="text-2xl font-black text-white mt-10 mb-4">Setting up your AI SDR with Aether</h2>

          <p>Aether includes Ava — an AI Sales Development Rep — as a pre-built agent on every account. You connect your Resend account (for email sending), upload your lead list, and Ava generates personalized emails for each lead based on the context you provide.</p>

          <p>You can customize Ava's system prompt to match your exact product, voice, and ideal customer profile. The more specific you are in the instructions, the better the output.</p>

          <p>Start with 25 free runs to see what the output looks like — no credit card required.</p>
        </div>

        <div className="mt-14 pt-8 border-t border-white/[0.06]">
          <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-bold"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
            Deploy your AI SDR →
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-white/[0.05] flex items-center justify-between text-sm text-zinc-700">
          <Link href="/blog" className="hover:text-zinc-400 transition-colors">← All posts</Link>
          <span>© {new Date().getFullYear()} Aether AI, Inc.</span>
        </div>
      </article>
    </div>
  );
}
