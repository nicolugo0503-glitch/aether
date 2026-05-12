"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Calendar, Share2,
  Instagram, Facebook, Twitter, CheckCircle2,
  XCircle, Clock, Plus, Sparkles, BarChart3,
} from "lucide-react";

type SocialPost = {
  id: string;
  topic: string;
  caption: string;
  hashtags: string;
  platforms: string;
  status: string;
  imageUrl: string | null;
  postedAt: string | null;
  error: string | null;
  createdAt: string;
};

const ACCENT = "#0ea5e9";
const ACCENT2 = "#38bdf8";
const ACCENT3 = "#7dd3fc";

const PLATFORM_META = {
  facebook:  { label: "FB",  icon: Facebook,  color: "#1877f2", bg: "#1877f212" },
  instagram: { label: "IG",  icon: Instagram, color: "#e1306c", bg: "#e1306c12" },
  x:         { label: "X",   icon: Twitter,   color: "#e7e9ea", bg: "#e7e9ea10" },
} as const;

function statusInfo(status: string) {
  switch (status) {
    case "posted":  return { color: "#10b981", icon: CheckCircle2, label: "Published" };
    case "partial": return { color: "#f59e0b", icon: CheckCircle2, label: "Partial"   };
    case "error":   return { color: "#ef4444", icon: XCircle,      label: "Failed"    };
    default:        return { color: "#52525b", icon: Clock,        label: "Draft"     };
  }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function calendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function SocialCalendarPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/social");
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  /* Build a map: dateKey → posts */
  const postMap = new Map<string, SocialPost[]>();
  posts.forEach(p => {
    const raw = p.postedAt ?? p.createdAt;
    const key = getDateKey(new Date(raw));
    if (!postMap.has(key)) postMap.set(key, []);
    postMap.get(key)!.push(p);
  });

  const days      = calendarDays(year, month);
  const todayKey  = getDateKey(now);
  const selPosts  = selected ? (postMap.get(selected) ?? []) : [];

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); setSelected(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0);  } else setMonth(m => m+1); setSelected(null); };

  const totalPosts     = posts.length;
  const publishedPosts = posts.filter(p => p.status === "posted").length;
  const draftPosts     = posts.filter(p => p.status === "draft").length;
  const activeDays     = postMap.size;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

      <style>{`
        @property --ang-cal { syntax:'<angle>'; inherits:false; initial-value:0deg; }
        @keyframes spin-ang-cal { to { --ang-cal: 360deg; } }
        @keyframes cal-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cal-pulse {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(14,165,233,0.5); }
          50% { opacity:0.7; box-shadow:0 0 0 6px rgba(14,165,233,0); }
        }
        @keyframes shimmer-cal {
          0% { transform:translateX(-100%) skewX(-12deg); }
          100% { transform:translateX(300%) skewX(-12deg); }
        }

        .cal-day-cell {
          min-height: 90px;
          border-radius: 12px;
          padding: 8px;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(4,4,12,0.6);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .cal-day-cell:hover {
          border-color: ${ACCENT}44;
          background: rgba(14,165,233,0.05);
        }
        .cal-day-cell.today {
          border-color: ${ACCENT}55;
          background: ${ACCENT}0a;
        }
        .cal-day-cell.selected {
          border-color: ${ACCENT}88 !important;
          background: ${ACCENT}14 !important;
          box-shadow: 0 0 20px ${ACCENT}22;
        }
        .cal-day-cell.has-posts {
          border-color: rgba(255,255,255,0.08);
        }
        .cal-day-cell.empty-cell {
          background: transparent;
          border-color: transparent;
          cursor: default;
          pointer-events: none;
        }

        .stat-card-cal {
          position: relative; border-radius: 14px; padding: 1px;
          background-image: conic-gradient(from var(--ang-cal), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT});
          animation: spin-ang-cal 6s linear infinite;
          overflow: hidden;
        }
        .stat-card-cal::before {
          content: ''; position: absolute; inset: 1px; border-radius: 13px;
          background: linear-gradient(135deg, rgba(10,14,39,0.96), rgba(8,18,38,0.96)); z-index: 0;
        }
        .stat-inner-cal { position: relative; z-index: 1; padding: 16px 14px; }

        .detail-item {
          border-radius: 12px; padding: 14px 16px;
          background: rgba(4,4,12,0.8);
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color 0.15s ease;
          animation: cal-in 0.3s ease both;
        }
        .detail-item:hover { border-color: ${ACCENT}33; }

        .platform-dot {
          width: 16px; height: 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .cal-nav-btn {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #71717a; transition: all 0.15s ease;
        }
        .cal-nav-btn:hover { background: ${ACCENT}18; border-color: ${ACCENT}44; color: ${ACCENT3}; }

        .quick-link {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          color: #52525b; cursor: pointer; text-decoration: none;
          transition: all 0.15s ease;
        }
        .quick-link:hover { background: ${ACCENT}18; border-color: ${ACCENT}33; color: ${ACCENT3}; }

        .month-label-dot {
          width: 6px; height: 6px; border-radius: 50%;
          display: inline-block; margin-right: 3px;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, animation: "cal-in 0.4s ease both" }}>
        <Link href="/dashboard/social" style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
        }}>
          <ChevronLeft size={15} color="#71717a" />
        </Link>
        <div style={{
          width: 42, height: 42, borderRadius: 14, padding: 1, flexShrink: 0,
          backgroundImage: `conic-gradient(from var(--ang-cal), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT})`,
          animation: "spin-ang-cal 4s linear infinite",
        }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: 13,
            background: "linear-gradient(135deg,#0a1230,#0e1a40)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Calendar size={18} color={ACCENT3} />
          </div>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>Content Calendar</h1>
          <p style={{ fontSize: 12, color: "#52525b", margin: 0, marginTop: 2 }}>
            {totalPosts} posts · {publishedPosts} published · {activeDays} active days
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link href="/dashboard/social" className="quick-link">
            <Plus size={12} /> New Post
          </Link>
          <Link href="/dashboard/analytics" className="quick-link">
            <BarChart3 size={12} /> Analytics
          </Link>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24, animation: "cal-in 0.4s ease 0.05s both" }}>
        {[
          { label: "Total Posts",    value: totalPosts,     color: ACCENT },
          { label: "Published",      value: publishedPosts, color: "#10b981" },
          { label: "Drafts",         value: draftPosts,     color: "#f59e0b" },
          { label: "Active Days",    value: activeDays,     color: "#a855f7" },
        ].map(s => (
          <div key={s.label} className="stat-card-cal">
            <div className="stat-inner-cal">
              <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start", animation: "cal-in 0.4s ease 0.1s both" }}>

        {/* ── CALENDAR ── */}
        <div style={{ borderRadius: 20, background: "rgba(4,4,12,0.8)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>

          {/* Month nav */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: `linear-gradient(135deg, rgba(14,165,233,0.06) 0%, transparent 60%)`,
          }}>
            <button onClick={prevMonth} className="cal-nav-btn">
              <ChevronLeft size={15} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>
                {MONTHS[month]} {year}
              </div>
              <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>
                {postMap.size} day{postMap.size !== 1 ? "s" : ""} with posts this month
              </div>
            </div>
            <button onClick={nextMonth} className="cal-nav-btn">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, padding: "14px 14px 8px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, padding: "0 14px 14px" }}>
            {loading ? (
              <div style={{ gridColumn: "span 7", textAlign: "center", padding: "60px 0", color: "#52525b", fontSize: 13 }}>
                Loading posts...
              </div>
            ) : days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="cal-day-cell empty-cell" />;
              const key       = getDateKey(day);
              const dayPosts  = postMap.get(key) ?? [];
              const isToday   = key === todayKey;
              const isSel     = key === selected;
              const hasPost   = dayPosts.length > 0;

              return (
                <div
                  key={key}
                  className={`cal-day-cell${isToday ? " today" : ""}${isSel ? " selected" : ""}${hasPost ? " has-posts" : ""}`}
                  onClick={() => setSelected(isSel ? null : key)}
                >
                  {/* Day number */}
                  <div style={{
                    fontSize: 13, fontWeight: isToday ? 900 : 600,
                    color: isToday ? ACCENT3 : isSel ? "#fff" : "#71717a",
                    marginBottom: 6, lineHeight: 1,
                  }}>
                    {day.getDate()}
                    {isToday && (
                      <span style={{
                        display: "inline-block", width: 4, height: 4, borderRadius: "50%",
                        background: ACCENT, boxShadow: `0 0 6px ${ACCENT}`,
                        marginLeft: 4, verticalAlign: "middle",
                        animation: "cal-pulse 2s ease infinite",
                      }} />
                    )}
                  </div>

                  {/* Post dots */}
                  {dayPosts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {dayPosts.slice(0, 3).map((p, i) => {
                        const info = statusInfo(p.status);
                        const plats: string[] = JSON.parse(p.platforms || "[]");
                        return (
                          <div key={p.id} style={{
                            fontSize: 9, fontWeight: 700, lineHeight: 1.3,
                            padding: "2px 5px", borderRadius: 5,
                            background: `${info.color}14`,
                            color: info.color,
                            border: `1px solid ${info.color}22`,
                            display: "flex", alignItems: "center", gap: 3,
                            overflow: "hidden",
                          }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {p.topic.slice(0, 18)}
                            </span>
                            <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                              {plats.slice(0, 2).map(pid => {
                                const pm = PLATFORM_META[pid as keyof typeof PLATFORM_META];
                                if (!pm) return null;
                                const PIcon = pm.icon;
                                return <PIcon key={pid} size={7} color={pm.color} />;
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <div style={{ fontSize: 9, color: "#52525b", paddingLeft: 5, fontWeight: 700 }}>
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.04)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.1em" }}>Legend</span>
            {[
              { color: "#10b981", label: "Published" },
              { color: "#f59e0b", label: "Partial"   },
              { color: "#ef4444", label: "Failed"    },
              { color: "#52525b", label: "Draft"     },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#52525b", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── DETAIL PANEL ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Month overview */}
          <div style={{
            borderRadius: 16, padding: "16px",
            background: "rgba(4,4,12,0.8)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              {MONTHS[month]} Overview
            </div>
            {/* Posts this month */}
            {(() => {
              const monthPosts = posts.filter(p => {
                const d = new Date(p.postedAt ?? p.createdAt);
                return d.getFullYear() === year && d.getMonth() === month;
              });
              const pub = monthPosts.filter(p => p.status === "posted").length;
              const err = monthPosts.filter(p => p.status === "error").length;
              const drft = monthPosts.filter(p => p.status === "draft").length;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Total Posts",  value: monthPosts.length, color: ACCENT      },
                    { label: "Published",    value: pub,               color: "#10b981"   },
                    { label: "Failed",       value: err,               color: "#ef4444"   },
                    { label: "Drafts",       value: drft,              color: "#f59e0b"   },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#71717a" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.color, display: "inline-block", boxShadow: `0 0 6px ${row.color}88` }} />
                        {row.label}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: row.color }}>{row.value}</span>
                    </div>
                  ))}

                  {/* Progress bar */}
                  {monthPosts.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", gap: 1 }}>
                        <div style={{ flex: pub,                        background: "#10b981",  borderRadius: 999 }} />
                        <div style={{ flex: drft,                       background: "#f59e0b",  borderRadius: 999 }} />
                        <div style={{ flex: err,                        background: "#ef4444",  borderRadius: 999 }} />
                        <div style={{ flex: monthPosts.length - pub - drft - err, background: "#3f3f46", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 5 }}>
                        {monthPosts.length > 0 ? Math.round(pub / monthPosts.length * 100) : 0}% published this month
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Selected day detail */}
          {selected ? (
            <div style={{
              borderRadius: 16, overflow: "hidden",
              background: "rgba(4,4,12,0.8)", border: `1px solid ${ACCENT}33`,
              boxShadow: `0 0 20px ${ACCENT}10`,
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: `1px solid ${ACCENT}18`,
                background: `linear-gradient(90deg, ${ACCENT}10 0%, transparent 70%)`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>
                    {new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 10, color: ACCENT, marginTop: 2 }}>
                    {selPosts.length} post{selPosts.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: 16, lineHeight: 1,
                }}>×</button>
              </div>

              <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                {selPosts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#52525b" }}>
                    No posts on this day.
                    <div style={{ marginTop: 10 }}>
                      <Link href="/dashboard/social" style={{ color: ACCENT, fontWeight: 700, textDecoration: "none", fontSize: 12 }}>
                        + Create post
                      </Link>
                    </div>
                  </div>
                ) : selPosts.map((p, i) => {
                  const info  = statusInfo(p.status);
                  const plats = JSON.parse(p.platforms || "[]") as string[];
                  const InfoIcon = info.icon;
                  return (
                    <div key={p.id} className="detail-item" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: `${info.color}14`, border: `1px solid ${info.color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <InfoIcon size={14} color={info.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
                            {p.topic.slice(0, 40)}{p.topic.length > 40 ? "…" : ""}
                          </div>
                          <p style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5, margin: 0 }}>
                            {p.caption.slice(0, 80)}{p.caption.length > 80 ? "…" : ""}
                          </p>

                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                              background: `${info.color}14`, color: info.color,
                              border: `1px solid ${info.color}22`,
                            }}>
                              {info.label}
                            </span>
                            {plats.map(pid => {
                              const pm = PLATFORM_META[pid as keyof typeof PLATFORM_META];
                              if (!pm) return null;
                              const PIcon = pm.icon;
                              return (
                                <div key={pid} style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  fontSize: 9, padding: "2px 7px", borderRadius: 999,
                                  background: pm.bg, color: pm.color,
                                  border: `1px solid ${pm.color}22`,
                                }}>
                                  <PIcon size={8} /> {pm.label}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Link href="/dashboard/social" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 700, color: ACCENT, textDecoration: "none",
                }}>
                  <Plus size={11} /> Create post for this date
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              borderRadius: 16, padding: "20px",
              background: "rgba(4,4,12,0.6)", border: "1px dashed rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <Calendar size={22} color="#3f3f46" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 12, color: "#3f3f46", margin: 0 }}>Click any day to see its posts</p>
            </div>
          )}

          {/* Platform breakdown */}
          <div style={{
            borderRadius: 16, padding: "16px",
            background: "rgba(4,4,12,0.8)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Platform Breakdown
            </div>
            {(["facebook","instagram","x"] as const).map(pid => {
              const pm     = PLATFORM_META[pid];
              const PIcon  = pm.icon;
              const count  = posts.filter(p => {
                const plats = JSON.parse(p.platforms || "[]") as string[];
                return plats.includes(pid);
              }).length;
              const pct = totalPosts > 0 ? Math.round(count / totalPosts * 100) : 0;
              return (
                <div key={pid} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: pm.color, fontWeight: 700 }}>
                      <PIcon size={11} />
                      {pm.label === "FB" ? "Facebook" : pm.label === "IG" ? "Instagram" : "X / Twitter"}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: pm.color }}>{count}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pm.color, borderRadius: 999, transition: "width 0.4s ease", boxShadow: `0 0 6px ${pm.color}88` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { href: "/dashboard/social", icon: Sparkles, label: "Generate New Post",  color: ACCENT },
              { href: "/dashboard/social", icon: Share2,   label: "View Post History",  color: "#10b981" },
              { href: "/dashboard/analytics", icon: BarChart3, label: "Full Analytics", color: "#a855f7" },
            ].map(a => (
              <Link key={a.href + a.label} href={a.href} style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "10px 14px", borderRadius: 12, textDecoration: "none",
                background: "rgba(4,4,12,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 12, fontWeight: 700, color: "#71717a",
                transition: "all 0.15s ease",
              }}>
                <a.icon size={13} color={a.color} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAV STRIP ── */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        padding: "14px 18px", borderRadius: 14,
        background: "rgba(8,10,28,0.9)", border: "1px solid rgba(255,255,255,0.06)",
        marginTop: 28,
      }}>
        {[
          { href: "/dashboard",          label: "Overview"    },
          { href: "/dashboard/social",   label: "Social Media" },
          { href: "/dashboard/agents",   label: "AI Employees" },
          { href: "/dashboard/runs",     label: "Run History"  },
          { href: "/dashboard/billing",  label: "Billing"      },
        ].map(link => (
          <Link key={link.href} href={link.href} className="quick-link">{link.label}</Link>
        ))}
      </div>
    </div>
  );
}
