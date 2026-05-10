"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const ACCENT = "#0ea5e9";   // cyan — distinct from the chat bubble purple

type Stage = "idle" | "open" | "submitting" | "done" | "error";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>("idle");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");

  const reset = () => {
    setStage("idle");
    setRating(0);
    setHovered(0);
    setMessage("");
  };

  const submit = useCallback(async () => {
    if (rating === 0) return;
    setStage("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message, page: pathname }),
      });
      if (!res.ok) throw new Error("Failed");
      setStage("done");
      setTimeout(reset, 3000);
    } catch {
      setStage("error");
      setTimeout(reset, 3000);
    }
  }, [rating, message, pathname]);

  const displayed = hovered || rating;

  const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <>
      {/* ── TRIGGER BUTTON ── */}
      <button
        onClick={() => stage === "idle" && setStage("open")}
        aria-label="Give feedback"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 9996,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 15px 9px 12px",
          borderRadius: 50,
          border: "1px solid rgba(14,165,233,0.25)",
          background: "rgba(8,8,16,0.92)",
          cursor: "pointer",
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(14,165,233,0.5)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 16px rgba(14,165,233,0.2)`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(14,165,233,0.25)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
        }}
      >
        {/* Star icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill={ACCENT} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.01em" }}>
          Give feedback
        </span>
      </button>

      {/* ── MODAL ── */}
      {stage !== "idle" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9995,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            padding: "0 0 88px 24px",
            pointerEvents: stage === "submitting" ? "none" : "auto",
          }}
          onClick={(e) => e.target === e.currentTarget && reset()}
        >
          <div
            style={{
              width: 340,
              maxWidth: "calc(100vw - 48px)",
              borderRadius: 20,
              background: "rgba(8,8,16,0.97)",
              border: "1px solid rgba(14,165,233,0.2)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
              backdropFilter: "blur(24px)",
              animation: "fbSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <style>{`
              @keyframes fbSlideUp {
                from { opacity:0; transform: translateY(14px) scale(0.96); }
                to   { opacity:1; transform: translateY(0) scale(1); }
              }
              .fb-star { transition: transform 0.12s, color 0.12s; }
              .fb-star:hover { transform: scale(1.2) !important; }
              .fb-textarea:focus { outline: none; border-color: rgba(14,165,233,0.45) !important; }
            `}</style>

            {/* Header */}
            <div style={{
              padding: "16px 18px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Share your feedback</div>
                <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Help us make Aether better</div>
              </div>
              <button
                onClick={reset}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#52525b", padding: 4, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#52525b")}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 18px 20px" }}>

              {stage === "done" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🙏</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Thank you!</div>
                  <div style={{ fontSize: 13, color: "#71717a" }}>Your feedback helps us improve Aether.</div>
                </div>
              ) : stage === "error" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>😕</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Something went wrong</div>
                  <div style={{ fontSize: 13, color: "#71717a" }}>Please try again in a moment.</div>
                </div>
              ) : (
                <>
                  {/* Stars */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10, fontWeight: 500 }}>
                      How would you rate your experience?
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          className="fb-star"
                          onMouseEnter={() => setHovered(s)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(s)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                            transform: "scale(1)",
                          }}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24"
                            fill={s <= displayed ? "#f59e0b" : "rgba(255,255,255,0.08)"}
                            stroke={s <= displayed ? "#f59e0b" : "rgba(255,255,255,0.12)"}
                            strokeWidth="1.5"
                          >
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        </button>
                      ))}
                      {displayed > 0 && (
                        <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginLeft: 4 }}>
                          {STAR_LABELS[displayed]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8, fontWeight: 500 }}>
                      What can we improve? <span style={{ color: "#3f3f46" }}>(optional)</span>
                    </div>
                    <textarea
                      className="fb-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think, what's missing, or what broke…"
                      rows={4}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 12,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#d4d4d8",
                        resize: "none",
                        fontFamily: "inherit",
                        lineHeight: 1.5,
                        boxSizing: "border-box",
                        transition: "border-color 0.15s",
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submit}
                    disabled={rating === 0 || stage === "submitting"}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 12,
                      border: "none",
                      background: rating > 0
                        ? `linear-gradient(135deg, ${ACCENT}, #0284c7)`
                        : "rgba(255,255,255,0.06)",
                      color: rating > 0 ? "#fff" : "#52525b",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: rating > 0 ? "pointer" : "not-allowed",
                      transition: "background 0.15s, transform 0.1s",
                      fontFamily: "inherit",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={(e) => {
                      if (rating > 0) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    {stage === "submitting" ? "Sending…" : "Send Feedback"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
