import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { route, apiLogger } from '@/lib/api-middleware'
import { ValidationError, AuthenticationError } from '@/lib/api-errors'
import { z } from 'zod'

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/subscription-service', () => ({
  hasAccess: vi.fn().mockResolvedValue(true),
  getSubscriptionStatus: vi.fn(),
  startFreeTrial: vi.fn(),
  createCheckoutSession: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

const mockSession = (override?: Record<string, unknown>) => ({
  user: { id: 'user-1', email: 'test@test.com', role: 'TEACHER', name: 'Test User', ...override },
})

describe('api-middleware', () => {
  describe('route()', () => {
    it('rejects unauthenticated requests when auth is required', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

      const handler = route({ auth: 'TEACHER' }, async () => NextResponse.json({ ok: true }))
      const req = new NextRequest(new Request('http://localhost:3000/api/test', { method: 'POST' }))
      const res = await handler(req)
      expect(res.status).toBe(401)
    })

    it('rejects wrong role', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSession({ role: 'STUDENT' }))

      const handler = route({ auth: 'TEACHER' }, async () => NextResponse.json({ ok: true }))
      const req = new NextRequest(new Request('http://localhost:3000/api/test', { method: 'POST' }))
      const res = await handler(req)
      expect(res.status).toBe(403)
    })

    it('passes authenticated user to handler', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSession())

      const handler = route({ auth: 'TEACHER' }, async (_req, { user }) => {
        return NextResponse.json({ userId: user.id, role: user.role })
      })
      const req = new NextRequest(new Request('http://localhost:3000/api/test', { method: 'GET' }))
      const res = await handler(req)
      const body = await res.json()
      expect(body.userId).toBe('user-1')
      expect(body.role).toBe('TEACHER')
    })

    it('validates request body with Zod schema', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSession())

      const schema = z.object({ title: z.string().min(1) })
      const handler = route({ auth: 'TEACHER', schema }, async (_req, { body }) => {
        return NextResponse.json({ title: (body as { title: string }).title })
      })
      const req = new NextRequest(new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
        headers: { 'Content-Type': 'application/json' },
      }))
      const res = await handler(req)
      expect(res.status).toBe(400)
    })

    it('allows public routes when auth is "none"', async () => {
      const handler = route({ auth: 'none' }, async () => NextResponse.json({ ok: true }))
      const req = new NextRequest(new Request('http://localhost:3000/api/test', { method: 'GET' }))
      const res = await handler(req)
      expect(res.status).toBe(200)
    })

    it('allows multiple roles', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSession({ role: 'SUPER_ADMIN' }))

      const handler = route({ auth: ['TEACHER', 'SUPER_ADMIN'] }, async () => NextResponse.json({ ok: true }))
      const req = new NextRequest(new Request('http://localhost:3000/api/test', { method: 'GET' }))
      const res = await handler(req)
      expect(res.status).toBe(200)
    })
  })

  describe('apiLogger', () => {
    it('creates scoped logger', async () => {
      const log = apiLogger('test-scope')
      log.info('hello', { key: 'val' })
      const { logger } = vi.mocked(await import('@/lib/logger'))
      expect(logger.info).toHaveBeenCalledWith('[test-scope] hello', { key: 'val' })
    })
  })
})
