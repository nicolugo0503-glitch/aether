import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Admin endpoint — force-verify one or all unverified users.
 * Requires the ADMIN_SECRET env var in the Authorization header.
 *
 * Verify a specific email:
 *   POST /api/admin/force-verify
 *   Authorization: Bearer <ADMIN_SECRET>
 *   Body: { "email": "user@example.com" }
 *
 * Verify ALL unverified accounts:
 *   POST /api/admin/force-verify
 *   Authorization: Bearer <ADMIN_SECRET>
 *   Body: {}
 */
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let email: string | undefined;
  try {
    const body = await req.json();
    email = body.email ? String(body.email).toLowerCase().trim() : undefined;
  } catch {
    // no body = verify all
  }

  if (email) {
    // Verify a specific user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
    return NextResponse.json({ ok: true, verified: [email] });
  }

  // Verify all unverified accounts
  const result = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return NextResponse.json({ ok: true, verifiedCount: result.count });
}
