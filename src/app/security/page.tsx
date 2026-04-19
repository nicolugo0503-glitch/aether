import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";
const EMAIL = "security@useaether.net";
const DATE = "April 17, 2025";

export default function SecurityPage() {
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
          <h1 className="text-4xl font-black mb-4">Security</h1>
          <p className="text-zinc-500">Last updated: {DATE}</p>
        </div>

        <div className="space-y-10 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Our Commitment</h2>
            <p>Security is foundational to Aether. We protect your data, your integrations, and your business with enterprise-grade practices — regardless of which plan you're on.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data Encryption</h2>
            <p>All data transmitted to and from Aether is encrypted in transit using TLS 1.2+. Data stored at rest — including your API keys, integration credentials, and account information — is encrypted using AES-256. We never store sensitive credentials in plaintext.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Authentication</h2>
            <p>Aether uses signed JWT tokens for session management with a 30-day expiry. Passwords are hashed using bcrypt with a minimum cost factor of 12. We do not store plaintext passwords under any circumstances. We also enforce rate limiting on login and signup endpoints to prevent brute-force attacks.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">API Key Storage</h2>
            <p>When you connect third-party services (Resend, Meta, X, etc.), your API keys are encrypted before being written to the database. They are decrypted only at runtime within our secure application servers and are never exposed in logs, error messages, or client-side responses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Infrastructure</h2>
            <p>Aether is hosted on Vercel's globally distributed edge network and backed by Neon PostgreSQL. Database access is restricted exclusively to our application servers via private networking — no public database access is permitted. All environment variables and secrets are managed via Vercel's encrypted secrets manager.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Access Controls</h2>
            <p>Internal access to production systems follows the principle of least privilege. Only authorized personnel with a business need can access production infrastructure, and all access is logged and audited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Incident Response</h2>
            <p>In the event of a security incident affecting your data, we will notify affected users within 72 hours of discovery, in accordance with applicable regulations including GDPR. We maintain an incident response plan and conduct regular reviews of our security posture.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Responsible Disclosure</h2>
            <p>If you discover a potential security vulnerability in Aether, please report it to us privately at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>. We take all reports seriously and will respond within 48 hours. Please do not publicly disclose vulnerabilities before we've had a chance to investigate and remediate.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>Security questions or concerns? Reach our security team at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>.</p>
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
