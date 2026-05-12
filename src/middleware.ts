import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "aether_session";

export async function middleware(req: NextRequest) {
  const protectedPaths = ["/dashboard", "/onboarding"];
  const isProtected = protectedPaths.some(p => req.nextUrl.pathname.startsWith(p));

  if (isProtected) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Verify the JWT signature so a fake/tampered cookie is rejected at the edge.
    // jose is edge-runtime compatible; prisma is not (DB check happens per-page in getCurrentUser).
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret) {
      try {
        await jwtVerify(token, new TextEncoder().encode(authSecret));
      } catch {
        // Token is invalid or expired — clear cookie and redirect to login
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        const res = NextResponse.redirect(url);
        res.cookies.delete(COOKIE_NAME);
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
