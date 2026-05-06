import { NextRequest, NextResponse } from "next/server";

const AUTH_TOKEN_COOKIE = "sispaa_token";
const USER_ROLE_KEY = "user_role";
const USER_ID_KEY = "user_id";

function isAuthed(req: NextRequest) {
  return Boolean(req.cookies.get(AUTH_TOKEN_COOKIE)?.value);
}

function getUserRole(req: NextRequest): string | null {
  try {
    const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    if (!token) return null;
    
    // Extract role from localStorage (stored in HTTP header or cookie)
    // For now, we'll rely on localStorage from frontend
    // In a real app, you'd decode the JWT here
    return req.headers.get("x-user-role") || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthed(req);
  const userRole = getUserRole(req);

  // Redirect unauthenticated users to login (except for public pages)
  if (!authed && !pathname.startsWith("/auth")) {
    // Allow public pages
    const publicPages = ["/", "/dashboard", "/submit", "/auth/login", "/auth/register"];
    if (!publicPages.includes(pathname)) {
      // All other pages require auth
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is admin (from localStorage or JWT)
    // This is a basic check; more robust checking happens on frontend
    const isAdmin = userRole === "admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Require auth for worker area
  if (pathname.startsWith("/worker")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If already logged in, redirect from auth pages to dashboard
  if (pathname.startsWith("/auth")) {
    if (authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Redirect root to login if not authenticated
  if (pathname === "/") {
    if (authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    } else {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/worker/:path*", "/admin/:path*", "/auth/:path*", "/dashboard", "/submit", "/status"],
};

