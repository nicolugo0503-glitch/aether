import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MessageSquare, Star, Clock, Globe } from "lucide-react";

export const metadata = { title: "Feedback | Aether Dashboard" };

const STAR_COLOR = "#f59e0b";
const ACCENT = "#7c3aed";

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= rating ? STAR_COLOR : "rgba(255,255,255,0.08)"}
          stroke={s <= rating ? STAR_COLOR : "rgba(255,255,255,0.12)"}
          strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const labels: Record<number, { label: string; color: string }> = {
    1: { label: "Poor",      color: "#ef4444" },
    2: { label: "Fair",      color: "#f97316" },
    3: { label: "Good",      color: "#eab308" },
    4: { label: "Great",     color: "#22c55e" },
    5: { label: "Excellent", color: "#7c3aed" },
  };
  const { label, color } = labels[rating] ?? { label: "?", color: "#71717a" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      letterSpacing: "0.05em",
    }}>
      {label}
    </span>
  );
}

const ADMIN_EMAIL = "useaether.ai@gmail.com";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  const total = feedbacks.length;
  const avgRating = total > 0
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
    : "—";
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => f.rating === r).length,
    pct: total > 0 ? Math.round((feedbacks.filter((f) => f.rating === r).length / total) * 100) : 0,
  }));
  const withMessage = feedbacks.filter((f) => f.message?.trim()).length;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 16px rgba(124,58,237,0.35)`,
          }}>
            <MessageSquare size={16} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
              User Feedback
            </h1>
            <p style={{ fontSize: 12, color: "#52525b", margin: 0 }}>
              All reviews submitted through the feedback widget
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Reviews",    value: String(total),       icon: <MessageSquare size={14} />, color: ACCENT },
          { label: "Average Rating",   value: `${avgRating} / 5`,  icon: <Star size={14} />,          color: "#f59e0b" },
          { label: "With Comments",    value: String(withMessage),  icon: <Globe size={14} />,         color: "#0ea5e9" },
        ].map((s) => (
          <div key={s.label} style={{
            borderRadius: 14, padding: "16px 18px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
              <span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      {total > 0 && (
        <div style={{
          borderRadius: 14, padding: "18px 20px", marginBottom: 28,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#71717a", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Rating Distribution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dist.map((d) => (
              <div key={d.rating} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} width="10" height="10" viewBox="0 0 24 24"
                      fill={s <= d.rating ? STAR_COLOR : "rgba(255,255,255,0.06)"}
                      stroke="none">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </div>
                <div style={{ flex: 1, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${d.pct}%`,
                    background: `linear-gradient(90deg, ${STAR_COLOR}, #f97316)`,
                    transition: "width 0.5s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "#71717a", flexShrink: 0, width: 30, textAlign: "right" }}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {total === 0 ? (
        <div style={{
          borderRadius: 14, padding: "48px 24px", textAlign: "center",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No feedback yet</div>
          <div style={{ fontSize: 13, color: "#52525b" }}>Reviews from users will appear here.</div>
        </div>
      ) : (
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "90px 100px 1fr 160px 130px",
            gap: 0, padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {["Rating", "Score", "Comment", "Page", "Date"].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </div>
            ))}
          </div>

          {feedbacks.map((fb, i) => (
            <div key={fb.id} style={{
              display: "grid",
              gridTemplateColumns: "90px 100px 1fr 160px 130px",
              gap: 0, padding: "14px 18px",
              borderBottom: i < feedbacks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              alignItems: "center",
            }}>
              {/* Stars */}
              <div><Stars rating={fb.rating} /></div>

              {/* Badge */}
              <div><RatingBadge rating={fb.rating} /></div>

              {/* Comment + user */}
              <div>
                {fb.message?.trim() ? (
                  <div style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.5 }}>
                    &ldquo;{fb.message.trim()}&rdquo;
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#3f3f46", fontStyle: "italic" }}>No comment</div>
                )}
                {fb.user && (
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 3 }}>
                    {fb.user.name || fb.user.email}
                  </div>
                )}
              </div>

              {/* Page */}
              <div style={{ fontSize: 11, color: "#52525b", wordBreak: "break-all" }}>
                {fb.page ?? "—"}
              </div>

              {/* Date */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} color="#3f3f46" />
                <span style={{ fontSize: 11, color: "#52525b" }}>
                  {new Date(fb.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
