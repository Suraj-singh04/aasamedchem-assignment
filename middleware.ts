import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth/login", "/api/auth/register"]
const ADMIN_ROUTES = ["/admin", "/api/admin"]
const BUYER_ROUTES = ["/buyer", "/api/buyer"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  const token = request.cookies.get("medchem_token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const user = await verifyToken(token)

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Role-based route protection
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/buyer/browse", request.url))
  }

  if (BUYER_ROUTES.some((r) => pathname.startsWith(r)) && user.role !== "BUYER") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", user.sub)
  requestHeaders.set("x-user-role", user.role)
  requestHeaders.set("x-user-email", user.email)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}