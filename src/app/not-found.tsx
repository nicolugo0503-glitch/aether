import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#050507" }}
    >
      {/* Subtle glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12), transparent)",
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12 hover:opacity-80 transition-opacity">
          <AetherMark size={28} glow />
          <span className="font-black text-white text-lg tracking-tight">Aether</span>
        </Link>

        {/* 404 number */}
        <div
          className="text-[120px] font-black leading-none mb-4 select-none"
          style={{
            background: "linear-gradient(135deg, #7c3aed 30%, rgba(124,58,237,0.15))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          This page doesn't exist or was moved. Head back to your dashboard
          to continue building your AI workforce.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
            }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-zinc-400 font-semibold text-sm transition-all hover:text-white"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
