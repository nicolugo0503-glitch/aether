import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const protectedPaths = ["/dashboard", "/onboarding"];
  const isProtected = protectedPaths.some(p => req.nextUrl.pathname.startsWith(p));

  if (isProtected) {
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
  matcher: ["/dashboard/:path*", "/onboarding"],
};
