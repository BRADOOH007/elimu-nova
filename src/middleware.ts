import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If no token, redirect to sign in
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Role-based access control
    const userRole = token.role as string

    // Super Admin routes
    if (pathname.startsWith("/super-admin")) {
      if (userRole !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // School Admin routes
    if (pathname.startsWith("/school-admin")) {
      if (userRole !== "SCHOOL_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Teacher routes
    if (pathname.startsWith("/teacher")) {
      if (userRole !== "TEACHER") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Student routes
    if (pathname.startsWith("/student")) {
      if (userRole !== "STUDENT") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Parent routes
    if (pathname.startsWith("/parent")) {
      if (userRole !== "PARENT") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
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
    "/dashboard/:path*"
  ]
}
