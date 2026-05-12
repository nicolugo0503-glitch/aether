import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 5 contact submissions per hour per IP
  if (await isRateLimited(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  // HTML escape helper to prevent XSS in email template
  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }

  let name: string, email: string, subject: string, message: string;
  try {
    const body = await req.json();
    name    = String(body.name    || "").trim();
    email   = String(body.email   || "").toLowerCase().trim();
    subject = String(body.subject || "").trim();
    message = String(body.message || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.RESEND_FROM_EMAIL || "noreply@useaether.net";
  const supportEmail = "support@useaether.net";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Aether Contact Form <${fromEmail}>`,
          to: supportEmail,
          reply_to: email,
          subject: `[Contact] ${subject || "New message from Aether website"}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#09090b;color:#fff;border-radius:12px">
              <h2 style="margin-bottom:16px;font-size:20px;font-weight:700">New Contact Form Submission</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#a1a1aa;width:80px">Name</td><td style="padding:8px 0;color:#fff;font-weight:600">${esc(name)}</td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa">Email</td><td style="padding:8px 0"><a href="mailto:${esc(email)}" style="color:#a78bfa">${esc(email)}</a></td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa">Subject</td><td style="padding:8px 0;color:#fff">${esc(subject) || "(none)"}</td></tr>
              </table>
              <div style="margin-top:20px;padding:16px;background:#18181b;border-radius:8px;border:1px solid #27272a">
                <p style="color:#a1a1aa;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Message</p>
                <p style="color:#fff;white-space:pre-wrap;margin:0">${esc(message)}</p>
              </div>
              <p style="color:#52525b;font-size:12px;margin-top:24px">Sent from the Aether contact form at useaether.net</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        console.error("[contact] Resend error:", await res.json().catch(() => ({})));
        return NextResponse.json({ error: "Failed to send message. Please email us directly at support@useaether.net." }, { status: 500 });
      }
    } catch (err) {
      console.error("[contact] Network error:", err);
      return NextResponse.json({ error: "Failed to send message. Please email us directly at support@useaether.net." }, { status: 500 });
    }
  } else {
    // No email service configured — log and return success (admin sees it in logs)
    console.log("[contact] New contact form submission:", { name, email, subject, message });
  }

  return NextResponse.json({ ok: true });
}
