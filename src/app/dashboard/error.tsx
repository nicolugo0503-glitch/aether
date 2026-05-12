"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        <h2 className="text-white font-black text-2xl mb-3">Something went wrong</h2>
        <p className="text-zinc-500 text-sm mb-2 leading-relaxed">
          We hit an unexpected error loading this page. This has been logged and our team will look into it.
        </p>

        {error.digest && (
          <p className="text-zinc-700 text-xs font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all btn-shine"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-zinc-300 font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Home className="h-3.5 w-3.5" />
            Dashboard home
          </Link>
        </div>
      </div>
    </div>
  );
}
