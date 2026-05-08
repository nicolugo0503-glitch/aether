import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 3 reset requests per hour per IP
  if (isRateLimited(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
    // Return 200 even when rate-limited so we don't reveal info
    return NextResponse.json({ ok: true });
  }

  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true }); // Always 200 — don't reveal if email exists
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ ok: true }); // Silent — don't reveal user existence

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/reset-password/${token}`;

  // Send via Resend using system API key
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Aether <${fromEmail}>`,
        to: user.email,
        subject: "Reset your Aether password",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#09090b;color:#fff;border-radius:16px">
            <div style="margin-bottom:32px">
              <span style="font-size:24px;font-weight:900;color:#fff">Aether</span>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin-bottom:12px">Reset your password</h2>
            <p style="color:#a1a1aa;margin-bottom:28px;line-height:1.6">
              We received a request to reset the password for your Aether account. Click the button below — this link expires in 1 hour.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">
              Reset password →
            </a>
            <p style="color:#52525b;font-size:12px;margin-top:32px">
              If you didn't request this, you can safely ignore this email.<br/>
              Link: ${resetUrl}
            </p>
          </div>
        `,
      }),
    }).catch(() => null); // Fail silently — don't expose errors
  }

  return NextResponse.json({ ok: true });
}
