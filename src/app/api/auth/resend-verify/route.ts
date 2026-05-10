import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 3 resend attempts per hour per IP
  if (await isRateLimited(`resend-verify:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  let email: string;
  try {
    const body = await req.json();
    email = String(body.email || "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always respond with success to prevent email enumeration attacks
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.emailVerified) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured. Contact support@useaether.net." }, { status: 500 });
    }

    // Generate a fresh token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken },
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@useaether.net";
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.useaether.net"}/api/auth/verify-email?token=${verifyToken}`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Aether <${fromEmail}>`,
          to: email,
          subject: "Verify your Aether email",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#09090b;color:#fff;border-radius:16px">
              <div style="margin-bottom:32px">
                <span style="font-size:24px;font-weight:900;color:#fff">Aether</span>
              </div>
              <h2 style="font-size:22px;font-weight:700;margin-bottom:12px">Verify your email</h2>
              <p style="color:#a1a1aa;margin-bottom:28px;line-height:1.6">
                Click the button below to verify your email and access your workspace.
              </p>
              <a href="${verifyUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">
                Verify email →
              </a>
              <p style="color:#52525b;font-size:12px;margin-top:32px">
                If you didn't create an Aether account, you can safely ignore this email.<br/>
                Link: ${verifyUrl}
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[resend-verify] Resend API error:", data);
        return NextResponse.json({ error: "Failed to send email. Please try again or contact support." }, { status: 500 });
      }
    } catch (err) {
      console.error("[resend-verify] Network error:", err);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }
  }

  // Return success whether or not the user exists / is already verified
  return NextResponse.json({ ok: true });
}
