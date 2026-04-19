import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";
const EMAIL = "privacy@useaether.net";
const DATE = "April 17, 2025";

export default function CookiePolicyPage() {
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
          <h1 className="text-4xl font-black mb-4">Cookie Policy</h1>
          <p className="text-zinc-500">Last updated: {DATE}</p>
        </div>

        <div className="space-y-10 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">What Are Cookies?</h2>
            <p>Cookies are small text files stored in your browser when you visit a website. They allow the website to remember information about your visit, such as your login state and preferences.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How Aether Uses Cookies</h2>
            <p>Aether uses a minimal, privacy-first approach to cookies. We use only what is strictly necessary to operate the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">The Cookies We Use</h2>

            <div className="mt-4 rounded-2xl overflow-hidden border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th className="text-left px-5 py-3 text-white font-semibold">Cookie</th>
                    <th className="text-left px-5 py-3 text-white font-semibold">Purpose</th>
                    <th className="text-left px-5 py-3 text-white font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-5 py-4 font-mono text-violet-300 text-xs">aether_session</td>
                    <td className="px-5 py-4 text-zinc-400">Keeps you logged in to your Aether account</td>
                    <td className="px-5 py-4 text-zinc-400">30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">That's it. We do not use advertising cookies, analytics cookies, or any third-party tracking cookies. We do not use Google Analytics, Meta Pixel, or similar tracking services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Cookie Properties</h2>
            <p>Our session cookie is set with the following security attributes:</p>
            <ul className="mt-3 space-y-2 pl-5 list-disc">
              <li><strong className="text-white">HttpOnly</strong> — cannot be accessed by JavaScript, protecting against XSS attacks</li>
              <li><strong className="text-white">Secure</strong> — only sent over HTTPS connections</li>
              <li><strong className="text-white">SameSite=Lax</strong> — protects against cross-site request forgery (CSRF)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Managing Cookies</h2>
            <p>You can control cookies through your browser settings. If you disable our session cookie, you will not be able to stay logged in to your Aether account. Most browsers allow you to view, block, or delete cookies via their settings menu.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Changes to This Policy</h2>
            <p>If we ever change how we use cookies, we will update this page and notify users via email for significant changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>Questions about cookies? Contact us at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>.</p>
          </section>

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
