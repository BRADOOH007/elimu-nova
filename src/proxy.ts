// ──────────────────────────────────────────────────────────────
// Next.js Edge Proxy (formerly middleware.ts — renamed for Next.js 16+)
//   • Maintenance mode check (cached 30s, 2s timeout)
//   • Role-based page access via next-auth/middleware
//   • Redirects unauthenticated users to login
// ──────────────────────────────────────────────────────────────

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

let cachedMaintenance: { enabled: boolean; message: string } | null = null
let cacheTime = 0
const CACHE_TTL = 30_000

async function checkMaintenance(origin: string): Promise<{ enabled: boolean; message: string }> {
  const now = Date.now()
  if (cachedMaintenance && now - cacheTime < CACHE_TTL) return cachedMaintenance
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${origin}/api/super-admin/maintenance-status`, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const data: { enabled: boolean; message: string } = await res.json()
      cachedMaintenance = data
      cacheTime = now
      return data
    }
  } catch (e) { console.warn('[Proxy] Maintenance check failed:', e) }
  return { enabled: false, message: '' }
}

export default withAuth(
  async function proxy(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const userRole = token.role as string

    // Maintenance mode — skip for super admins and maintenance page
    if (pathname !== "/maintenance" && userRole !== "SUPER_ADMIN") {
      const maintenance = await checkMaintenance(req.nextUrl.origin)
      if (maintenance.enabled) {
        return NextResponse.redirect(new URL("/maintenance", req.url))
      }
    }

    if (pathname.startsWith("/super-admin")) {
      if (userRole !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/school-admin")) {
      if (userRole !== "SCHOOL_ADMIN") return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/teacher")) {
      if (userRole !== "TEACHER") return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/student")) {
      if (userRole !== "STUDENT") return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/parent")) {
      if (userRole !== "PARENT") return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/school-admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/dashboard/:path*",
  ]
}
