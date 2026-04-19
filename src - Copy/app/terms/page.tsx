import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const EFFECTIVE_DATE = "April 17, 2025";
const COMPANY = "Aether AI, Inc.";
const EMAIL = "legal@useaether.net";

export default function TermsPage() {
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
          <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
          <p className="text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Aether (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including visitors, registered users, and paying customers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>Aether is an AI automation platform that allows users to deploy AI agents (&ldquo;AI Employees&rdquo;) to automate tasks including email outreach, social media posting, and lead research. The Service integrates with third-party platforms such as Meta (Instagram, Facebook), X (Twitter), and email providers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Accounts and Registration</h2>
            <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized access to your account at {EMAIL}.</p>
            <p className="mt-2">You must be at least 18 years old to use this Service. By creating an account, you represent that you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Send spam, unsolicited messages, or violate any anti-spam laws (including CAN-SPAM, GDPR, and CASL)</li>
              <li>Violate the terms of service of any third-party platform (Meta, X, etc.)</li>
              <li>Engage in deceptive, misleading, or fraudulent activities</li>
              <li>Harass, abuse, or harm other individuals</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the Service</li>
              <li>Resell or sublicense the Service without written authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. AI-Generated Content</h2>
            <p>You acknowledge that the Service uses AI to generate content on your behalf. You are solely responsible for reviewing, approving, and taking responsibility for all content published through your account. {COMPANY} is not liable for any AI-generated content that violates third-party terms, laws, or regulations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Billing and Payments</h2>
            <p>Paid plans are billed monthly in advance. All payments are processed through Stripe. Refunds are issued at our sole discretion within 7 days of a charge. Free plan users receive 25 AI runs per period. Plan limits are enforced automatically. We reserve the right to change pricing with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Third-Party Integrations</h2>
            <p>Aether connects to third-party services (Meta, X, Resend, OpenAI, etc.) on your behalf using credentials you provide. You are responsible for complying with the terms of all connected platforms. We are not responsible for changes to or disruption of third-party APIs.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Intellectual Property</h2>
            <p>You retain ownership of all content you create and upload. By using the Service, you grant {COMPANY} a limited license to process your content solely to provide the Service. {COMPANY} retains all rights to the platform, its code, and its brand.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Disclaimers and Limitation of Liability</h2>
            <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the fullest extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, data loss, or business interruption, even if advised of the possibility.</p>
            <p className="mt-2">Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months prior to the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these Terms or any applicable law. You may cancel your account at any time from the billing page. Upon termination, your data will be deleted within 30 days unless retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Changes to Terms</h2>
            <p>We may update these Terms at any time. We will notify you of material changes via email. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration under the AAA rules, except you may bring claims in small claims court.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.05] flex items-center justify-between text-sm text-zinc-700">
          <span>© {new Date().getFullYear()} {COMPANY}</span>
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
