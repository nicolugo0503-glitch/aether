"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            We hit an unexpected error. Our team has been notified. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ color: "#3f3f46", fontSize: 11, marginBottom: 24, fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              Try again
            </button>
            <a href="/" style={{ padding: "10px 24px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#d4d4d8", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
