import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/libs/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Public routes allowed
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout") ||

    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // If no token → redirect to /login (but avoid loop)
  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Verify token
  const payload = await verifyJwt(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("token", "", { expires: new Date(0) }); // clear invalid cookie
    return res;
  }

  // If logged in and visiting /login → redirect to /
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Attach user payload
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user", JSON.stringify(payload));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"], // protect all routes except assets
};
