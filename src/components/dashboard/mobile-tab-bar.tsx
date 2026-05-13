"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, ListChecks, Share2, Menu, X,
  Megaphone, BarChart3, Users, Gift, CreditCard, Settings,
  Star, Send, ChevronRight,
} from "lucide-react";

const PRIMARY_TABS = [
  { href: "/dashboard",        label: "Home",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/runs",   label: "Runs",   icon: ListChecks },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
];

const MORE_ITEMS = [
  { href: "/dashboard/campaigns",  label: "Campaigns",  desc: "Email & social campaigns", icon: Megaphone,  color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  { href: "/dashboard/analytics",  label: "Analytics",  desc: "Performance & ROI metrics", icon: BarChart3,  color: "#22c55e", bg: "rgba(34,197,94,0.15)"   },
  { href: "/dashboard/team",       label: "Team",       desc: "Members & permissions",     icon: Users,      color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  { href: "/dashboard/referrals",  label: "Referrals",  desc: "Earn rewards for referrals",icon: Gift,       color: "#ec4899", bg: "rgba(236,72,153,0.15)"  },
  { href: "/dashboard/billing",    label: "Billing",    desc: "Plan & payment settings",   icon: CreditCard, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  { href: "/dashboard/settings",   label: "Settings",   desc: "Account & workspace",       icon: Settings,   color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
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
    setFbRating(0); setFbHovered(0); setFbMessage(""); setFbStage("idle");
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
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => { setOpen(false); resetFb(); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              borderRadius: "24px 24px 0 0",
              background: "#0a0a0f",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "85dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 20px 16px",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>More</div>
                <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>All sections</div>
              </div>
              <button
                onClick={() => { setOpen(false); resetFb(); }}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "#71717a", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + 80px)" }}>
              <div style={{ padding: "0 16px 20px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
                  {MORE_ITEMS.map((item, i) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => { setOpen(false); resetFb(); }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", textDecoration: "none", background: active ? "rgba(124,58,237,0.08)" : "transparent", borderBottom: i < MORE_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? "rgba(124,58,237,0.2)" : item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={18} color={active ? "#a78bfa" : item.color} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: active ? "#a78bfa" : "#e4e4e7", lineHeight: 1.2 }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: "#52525b", marginTop: 2, lineHeight: 1.3 }}>{item.desc}</div>
                        </div>
                        <ChevronRight size={16} color={active ? "#a78bfa" : "#3f3f46"} strokeWidth={2.5} />
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: "0 16px 8px" }}>
                <div style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 18, padding: "18px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Star size={16} fill="#0ea5e9" stroke="none" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Rate your experience</div>
                      <div style={{ fontSize: 12, color: "#52525b", marginTop: 1 }}>Help us improve Aether</div>
                    </div>
                  </div>
                  {fbStage === "done" ? (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "#22c55e", fontSize: 14, fontWeight: 600 }}>🙏 Thanks for your feedback!</div>
                  ) : fbStage === "error" ? (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "#ef4444", fontSize: 13, fontWeight: 600 }}>😕 Something went wrong. Try again.</div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                        {[1,2,3,4,5].map((s) => (
                          <button key={s} onMouseEnter={() => setFbHovered(s)} onMouseLeave={() => setFbHovered(0)} onClick={() => setFbRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, lineHeight: 0 }}>
                            <Star size={28} fill={s <= fbDisplayed ? "#f59e0b" : "rgba(255,255,255,0.07)"} stroke={s <= fbDisplayed ? "#f59e0b" : "rgba(255,255,255,0.15)"} strokeWidth={1.5} />
                          </button>
                        ))}
                        {fbDisplayed > 0 && <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, marginLeft: 4 }}>{STAR_LABELS[fbDisplayed]}</span>}
                      </div>
                      <textarea value={fbMessage} onChange={(e) => setFbMessage(e.target.value)} placeholder="What can we improve? (optional)" rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px", fontSize: 13, color: "#d4d4d8", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 12, outline: "none" }} />
                      <button onClick={submitFeedback} disabled={fbRating === 0 || fbStage === "submitting"} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "none", background: fbRating > 0 ? "linear-gradient(135deg, #0ea5e9, #7c3aed)" : "rgba(255,255,255,0.05)", color: fbRating > 0 ? "#fff" : "#3f3f46", fontSize: 14, fontWeight: 700, cursor: fbRating > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                        <Send size={14} />{fbStage === "submitting" ? "Sending…" : "Send Feedback"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: "rgba(4,4,8,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        {PRIMARY_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]" style={{ color: active ? "#a78bfa" : "#52525b", background: active ? "rgba(124,58,237,0.1)" : "transparent" }}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]" style={{ color: isMoreActive ? "#a78bfa" : "#52525b", background: isMoreActive ? "rgba(124,58,237,0.1)" : "transparent", border: "none", cursor: "pointer" }}>
          <Menu className="h-5 w-5 shrink-0" strokeWidth={isMoreActive ? 2.5 : 1.75} />
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
