import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Lightweight guard: if someone hits /dashboard without the session cookie,
  // short-circuit to /login. Full auth check still happens inside the layout.
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("aether_session")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
