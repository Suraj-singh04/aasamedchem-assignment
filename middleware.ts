import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const token = request.cookies.get("medchem_token")?.value

  // No token
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      )
    }

    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify token
  const user = await verifyToken(token)

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Admin pages + admin APIs
  if (
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/api/admin")) &&
    user.role !== "ADMIN"
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.redirect(
      new URL("/buyer/browse", request.url)
    )
  }

  // Buyer pages + buyer APIs
  if (
    (pathname.startsWith("/buyer") ||
      pathname.startsWith("/api/buyer")) &&
    user.role !== "BUYER"
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.redirect(
      new URL("/admin/dashboard", request.url)
    )
  }

  // Forward user info to route handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", user.sub)
  requestHeaders.set("x-user-role", user.role)
  requestHeaders.set("x-user-email", user.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}