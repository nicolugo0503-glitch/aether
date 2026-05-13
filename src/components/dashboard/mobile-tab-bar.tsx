"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, ListChecks, Share2, Menu, X,
  Megaphone, BarChart3, Users, Gift, CreditCard, Settings,
  Star, Send,
} from "lucide-react";

const PRIMARY_TABS = [
  { href: "/dashboard",        label: "Home",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/runs",   label: "Runs",   icon: ListChecks },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
];

const MORE_ITEMS = [
  { href: "/dashboard/campaigns",  label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/analytics",  label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team",       label: "Team",      icon: Users },
  { href: "/dashboard/referrals",  label: "Referrals", icon: Gift },
  { href: "/dashboard/billing",    label: "Billing",   icon: CreditCard },
  { href: "/dashboard/settings",   label: "Settings",  icon: Settings },
];

type FbStage = "idle" | "submitting" | "done" | "error";

export function MobileTabBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const [fbRating, setFbRating] = useState(0);
  const [fbHovered, setFbHovered] = useState(0);
  const [fbMessage, setFbMessage] = useState("");
  const [fbStage, setFbStage] = useState<FbStage>("idle");

  const resetFb = () => {
    setFbRating(0);
    setFbHovered(0);
    setFbMessage("");
    setFbStage("idle");
  };

  const submitFeedback = useCallback(async () => {
    if (fbRating === 0) return;
    setFbStage("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: fbRating, message: fbMessage, page: path }),
      });
      if (!res.ok) throw new Error("Failed");
      setFbStage("done");
      setTimeout(() => { resetFb(); setOpen(false); }, 2200);
    } catch {
      setFbStage("error");
      setTimeout(resetFb, 2500);
    }
  }, [fbRating, fbMessage, path]);

  const isActive = (href: string, exact = false) =>
    exact ? path === href : path === href || (href !== "/dashboard" && path.startsWith(href));

  const isMoreActive = MORE_ITEMS.some((t) => path.startsWith(t.href));

  const fbDisplayed = fbHovered || fbRating;
  const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[9980]"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => { setOpen(false); resetFb(); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              borderRadius: "20px 20px 0 0",
              background: "rgba(4,4,8,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              maxHeight: "82dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 16px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.02em" }}>
                More sections
              </span>
              <button
                onClick={() => { setOpen(false); resetFb(); }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
                  color: "#a1a1aa", width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{
              overflowY: "auto", flex: 1,
              padding: "14px 16px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 76px)",
            }}>

              {/* Nav grid — 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {MORE_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { setOpen(false); resetFb(); }}
                      style={{
                        display: "flex", flexDirection: "row",
                        alignItems: "center", gap: 10,
                        padding: "13px 14px",
                        borderRadius: 14, textDecoration: "none",
                        background: active ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: active ? "#a78bfa" : "#a1a1aa",
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.75} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Give Feedback card */}
              <div style={{
                background: "rgba(14,165,233,0.05)",
                border: "1px solid rgba(14,165,233,0.15)",
                borderRadius: 16, padding: "16px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "rgba(14,165,233,0.15)",
                    border: "1px solid rgba(14,165,233,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Star size={16} fill="#0ea5e9" stroke="#0ea5e9" strokeWidth={1} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Rate your experience</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Help us make Aether better</div>
                  </div>
                </div>

                {fbStage === "done" ? (
                  <div style={{ textAlign: "center", padding: "12px 0", color: "#22c55e", fontSize: 13, fontWeight: 600 }}>
                    🙏 Thank you! We really appreciate it.
                  </div>
                ) : fbStage === "error" ? (
                  <div style={{ textAlign: "center", padding: "12px 0", color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
                    😕 Something went wrong. Please try again.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setFbHovered(s)}
                          onMouseLeave={() => setFbHovered(0)}
                          onClick={() => setFbRating(s)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}
                        >
                          <Star
                            size={28}
                            fill={s <= fbDisplayed ? "#f59e0b" : "rgba(255,255,255,0.07)"}
                            stroke={s <= fbDisplayed ? "#f59e0b" : "rgba(255,255,255,0.18)"}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                      {fbDisplayed > 0 && (
                        <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginLeft: 4 }}>
                          {STAR_LABELS[fbDisplayed]}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={fbMessage}
                      onChange={(e) => setFbMessage(e.target.value)}
                      placeholder="What can we improve? (optional)"
                      rows={2}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                        padding: "9px 11px", fontSize: 13, color: "#d4d4d8",
                        resize: "none", fontFamily: "inherit", lineHeight: 1.5,
                        boxSizing: "border-box", marginBottom: 10, outline: "none",
                      }}
                    />

                    <button
                      onClick={submitFeedback}
                      disabled={fbRating === 0 || fbStage === "submitting"}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 7, padding: "11px 0",
                        borderRadius: 12, border: "none",
                        background: fbRating > 0 ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "rgba(255,255,255,0.05)",
                        color: fbRating > 0 ? "#fff" : "#52525b",
                        fontSize: 13, fontWeight: 700,
                        cursor: fbRating > 0 ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                      }}
                    >
                      <Send size={14} />
                      {fbStage === "submitting" ? "Sending…" : "Send Feedback"}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: "rgba(4,4,8,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {PRIMARY_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]"
              style={{
                color: active ? "#a78bfa" : "#52525b",
                background: active ? "rgba(124,58,237,0.1)" : "transparent",
              }}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]"
          style={{
            color: isMoreActive ? "#a78bfa" : "#52525b",
            background: isMoreActive ? "rgba(124,58,237,0.1)" : "transparent",
            border: "none", cursor: "pointer",
          }}
        >
          <Menu className="h-5 w-5 shrink-0" strokeWidth={isMoreActive ? 2.5 : 1.75} />
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
