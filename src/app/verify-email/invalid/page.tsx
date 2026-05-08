import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

export default function VerifyEmailInvalidPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <AetherMark size={28} glow />
          <span className="font-black text-white tracking-tight">Aether</span>
        </Link>
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#f87171" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Invalid or expired link</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          This verification link is invalid or has already been used.
          Try signing up again to get a fresh link.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}
        >
          Create a new account →
        </Link>
      </div>
    </div>
  );
}
