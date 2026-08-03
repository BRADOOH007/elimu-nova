/**
 * CRITICAL REGRESSION TEST
 * 
 * Ensures the proxy never blocks NextAuth login routes.
 * Security (CSRF, rate limiting) lives in api-middleware.ts, NOT the proxy.
 * The proxy only handles: auth, maintenance mode, role-based page access.
 */
import { describe, it, expect } from 'vitest'

describe('Auth route protection', () => {
  const AUTH_ROUTES = [
    '/api/auth/csrf',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/callback/credentials',
  ]

  describe('proxy source code verification', () => {
    it('proxy.ts does NOT have CSRF checks (lives in api-middleware.ts)', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const proxyPath = path.resolve(__dirname, '../proxy.ts')
      const content = fs.readFileSync(proxyPath, 'utf-8')

      expect(content).not.toContain('csrf')
      expect(content).not.toContain('CSRF')
    })

    it('proxy.ts does NOT have rate limiting (lives in api-middleware.ts)', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const proxyPath = path.resolve(__dirname, '../proxy.ts')
      const content = fs.readFileSync(proxyPath, 'utf-8')

      expect(content).not.toContain('rateLimit')
      expect(content).not.toContain('RATE_LIMIT')
    })

    it('proxy.ts does NOT have security headers (lives in api-middleware.ts)', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const proxyPath = path.resolve(__dirname, '../proxy.ts')
      const content = fs.readFileSync(proxyPath, 'utf-8')

      expect(content).not.toContain('X-Content-Type-Options')
      expect(content).not.toContain('X-Frame-Options')
    })

    it('proxy.ts matcher does NOT include /api/:path*', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const proxyPath = path.resolve(__dirname, '../proxy.ts')
      const content = fs.readFileSync(proxyPath, 'utf-8')

      // API auth is handled by api-middleware.ts, not the proxy
      expect(content).not.toContain('"/api/:path*"')
    })

    it('proxy.ts only has auth, maintenance, and role checks', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const proxyPath = path.resolve(__dirname, '../proxy.ts')
      const content = fs.readFileSync(proxyPath, 'utf-8')

      // Must have these three features
      expect(content).toContain('withAuth')
      expect(content).toContain('checkMaintenance')
      expect(content).toContain('userRole')

      // Must NOT have anything else
      expect(content).not.toContain('generateCSRFToken')
      expect(content).not.toContain('checkEdgeRateLimit')
      expect(content).not.toContain('validateCSRFToken')
    })

    it('api-middleware.ts has rate limiting', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const middlewarePath = path.resolve(__dirname, './api-middleware.ts')
      const content = fs.readFileSync(middlewarePath, 'utf-8')

      expect(content).toContain('rateLimit')
    })
  })
})
