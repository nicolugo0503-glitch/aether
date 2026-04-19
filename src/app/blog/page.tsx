import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";
import { ArrowRight } from "lucide-react";

const COMPANY = "Aether AI, Inc.";

const POSTS = [
  {
    slug: "ai-automation-guide",
    tag: "AI Automation",
    tagColor: "rgba(124,58,237,0.15)",
    tagBorder: "rgba(124,58,237,0.25)",
    tagText: "#a78bfa",
    title: "The Complete Guide to AI Automation for Small Businesses",
    excerpt: "How founders and small teams are using AI agents to eliminate repetitive work, scale output, and compete with companies 10x their size.",
    date: "April 17, 2025",
    readTime: "8 min read",
  },
  {
    slug: "social-media-autopilot",
    tag: "Social Media",
    tagColor: "rgba(225,48,108,0.12)",
    tagBorder: "rgba(225,48,108,0.25)",
    tagText: "#f472b6",
    title: "How to Put Your Social Media on Autopilot with AI",
    excerpt: "A practical guide to automating Instagram, Facebook, and X — without sacrificing your brand voice or sounding like a robot.",
    date: "April 17, 2025",
    readTime: "6 min read",
  },
  {
    slug: "email-outreach-ai",
    tag: "Email Marketing",
    tagColor: "rgba(8,145,178,0.12)",
    tagBorder: "rgba(8,145,178,0.25)",
    tagText: "#67e8f9",
    title: "Why AI-Powered Cold Email Still Works in 2025",
    excerpt: "Cold email isn't dead — bad cold email is. Here's how AI is making outreach more personal, not less, and what that means for your pipeline.",
    date: "April 17, 2025",
    readTime: "7 min read",
  },
];

export default function BlogPage() {
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
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Blog</p>
          <h1 className="text-5xl font-black leading-tight mb-4">Insights & Updates</h1>
          <p className="text-zinc-400 text-lg">Guides on AI automation, social media growth, and building lean businesses.</p>
        </div>

        <div className="space-y-5">
          {POSTS.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block p-7 rounded-3xl transition-all"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: post.tagColor, color: post.tagText, border: `1px solid ${post.tagBorder}` }}>
                  {post.tag}
                </span>
                <span className="text-zinc-600 text-sm">{post.date} · {post.readTime}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white mb-2 group-hover:text-violet-300 transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">{post.excerpt}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-700 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
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
