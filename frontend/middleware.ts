import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_TOKEN_COOKIE = "sispaa_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "secret-key-change-in-production"
);

interface JWTPayload {
  sub: string;
  role: string;
  agency?: string | null;
  exp: number;
}

async function getTokenPayload(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const tokenPayload = await getTokenPayload(req);
  const authed = tokenPayload !== null;
  const userRole = tokenPayload?.role ?? null;

  // Redirect unauthenticated users away from protected pages
  if (!authed && !pathname.startsWith("/auth")) {
    const publicPages = ["/", "/submit", "/auth/login", "/auth/register"];
    if (!publicPages.includes(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes — must be authenticated AND have role "admin"
  if (pathname.startsWith("/admin")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Protect /worker routes — must be authenticated and have role worker/supervisor/admin
  if (pathname.startsWith("/worker")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const workerRoles = ["worker", "supervisor", "admin"];
    if (!workerRoles.includes(userRole ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname.startsWith("/auth") && authed) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirect root
  if (pathname === "/") {
    return NextResponse.redirect(
      authed
        ? new URL("/dashboard", req.nextUrl)
        : new URL("/auth/login", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/worker/:path*", "/admin/:path*", "/auth/:path*", "/dashboard", "/submit", "/status"],
};
