import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const EFFECTIVE_DATE = "April 17, 2025";
const COMPANY = "Aether AI, Inc.";
const EMAIL = "privacy@useaether.net";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AetherMark size={28} glow />
            <span className="font-black text-white tracking-tight">Aether</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">← Back home</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
          <p className="text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. What We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong className="text-white">Account data</strong>: name, email address, hashed password</li>
              <li><strong className="text-white">Integration credentials</strong>: API keys for Resend, Meta, X, and other platforms you connect (stored encrypted)</li>
              <li><strong className="text-white">Usage data</strong>: agent runs, campaign results, social posts created</li>
              <li><strong className="text-white">Billing data</strong>: managed by Stripe — we never store full card numbers</li>
              <li><strong className="text-white">Technical data</strong>: IP address, browser type, pages visited, timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Provide and improve the Aether platform</li>
              <li>Execute AI agent tasks on your behalf using credentials you supply</li>
              <li>Send transactional emails (password resets, billing receipts)</li>
              <li>Enforce plan limits and billing</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell your personal data. We do not use your data to train AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Third-Party Services</h2>
            <p>We share data with third-party providers only as necessary to deliver the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong className="text-white">OpenAI</strong> — processes your prompts and agent inputs to generate AI outputs</li>
              <li><strong className="text-white">Stripe</strong> — handles payment processing and subscription management</li>
              <li><strong className="text-white">Neon / PostgreSQL</strong> — hosts our database</li>
              <li><strong className="text-white">Vercel</strong> — hosts and deploys the application</li>
              <li><strong className="text-white">Resend</strong> — sends transactional emails</li>
              <li><strong className="text-white">Meta / X</strong> — receive content you authorize us to post on your behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
            <p>We protect your data using industry-standard measures:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>All data in transit encrypted via TLS/HTTPS</li>
              <li>Passwords hashed using bcrypt (never stored in plaintext)</li>
              <li>Authentication via signed JWT tokens with 30-day expiry</li>
              <li>API keys and secrets stored encrypted at rest</li>
              <li>Database access restricted to application servers only</li>
            </ul>
            <p className="mt-3">Despite our precautions, no system is 100% secure. Please use a strong, unique password for your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you cancel or your account is terminated, we delete your personal data within 30 days, except where required by law (e.g., billing records retained for 7 years for tax compliance).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Cookies</h2>
            <p>We use a single, essential session cookie (<code className="text-violet-300 bg-white/[0.04] px-1.5 py-0.5 rounded text-sm">aether_session</code>) to keep you logged in. This cookie is HttpOnly, Secure, and SameSite=Lax. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>. We respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Children&apos;s Privacy</h2>
            <p>Aether is not directed at children under 18. We do not knowingly collect personal data from minors. If we discover we have collected data from a child under 18, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. International Transfers</h2>
            <p>Your data may be processed in the United States and other countries where our service providers operate. We ensure appropriate safeguards are in place for any international transfers of personal data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We&apos;ll notify you of significant changes via email. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact</h2>
            <p>Questions or concerns about your privacy? Contact our privacy team at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.05] flex items-center justify-between text-sm text-zinc-700">
          <span>© {new Date().getFullYear()} {COMPANY}</span>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}
