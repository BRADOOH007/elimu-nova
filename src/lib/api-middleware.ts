import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { requireAuth, requireTeacher, requireSuperAdmin, requireRole } from '@/lib/with-auth'
import { validate } from '@/lib/validate'
import { handleApiError } from '@/lib/api-errors'
import { checkRateLimit, getClientIdentifier, rateLimitAPI, rateLimitAI } from '@/lib/rate-limit'
import { cache } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { checkAIUsageAllowed, recordAIUsage } from '@/lib/ai-usage'

type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
type UserInfo = { id: string; email: string; role: string; name: string; avatar?: string | null; studentId?: string; teacherId?: string; schoolAdminId?: string }

type Handler<T = unknown> = (
  request: NextRequest,
  context: { user: UserInfo; body?: T; params: Record<string, string>; session?: { user: UserInfo } }
) => Promise<NextResponse>

interface RouteConfig<T = unknown> {
  auth?: Role | Role[] | 'none'
  schema?: z.ZodType<T>
  rateLimit?: { maxRequests?: number; windowMs?: number } | false
  skipSubscriptionCheck?: boolean
}

function parseParams(request: NextRequest, maybeParams?: Record<string, string | Promise<string>>): Record<string, string> {
  const params: Record<string, string> = {}
  if (maybeParams) {
    for (const [key, val] of Object.entries(maybeParams)) {
      params[key] = typeof val === 'string' ? val : ''
    }
  }
  return params
}

const IDEMPOTENCY_TTL = 86_400
async function checkIdempotency(key: string, userId: string): Promise<{ cached: true; response: NextResponse } | null> {
  try {
    const cached = await cache.get(`idempotent:${key}:${userId}`)
    if (cached) return { cached: true, response: NextResponse.json(JSON.parse(cached as string)) }
  } catch { /* ignore */ }
  return null
}
async function setIdempotency(key: string, userId: string, response: NextResponse): Promise<void> {
  try {
    const clone = response.clone()
    const body = await clone.json()
    await cache.set(`idempotent:${key}:${userId}`, JSON.stringify(body), IDEMPOTENCY_TTL)
  } catch { /* ignore */ }
}

function auditLog(method: string, path: string, userId: string | undefined, status: number, durationMs: number) {
  const entry = { ts: new Date().toISOString(), method, path, userId: userId || 'anonymous', status, durationMs }
  if (status >= 500) console.error('[AUDIT]', JSON.stringify(entry))
  else if (status >= 400) console.warn('[AUDIT]', JSON.stringify(entry))
  else console.log('[AUDIT]', JSON.stringify(entry))
}

const SUBSCRIPTION_EXEMPT_PREFIXES = [
  '/api/auth/',
  '/api/subscription/',
  '/api/webhooks/',
  '/api/debug/',
]

async function checkSubscriptionAccess(user: UserInfo, path: string): Promise<{ allowed: boolean; response?: NextResponse }> {
  if (user.role === 'SUPER_ADMIN') return { allowed: true }

  for (const prefix of SUBSCRIPTION_EXEMPT_PREFIXES) {
    if (path.startsWith(prefix)) return { allowed: true }
  }

  let userId: string | undefined
  let schoolId: string | undefined

  try {
    // resolve the school/independent user via DB lookup by user.id.
    // requireAuth() only exposes id/email/role/name, so we can't rely on
    // session-provided role ids here.
    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { schoolId: true }
      })
      if (teacher?.schoolId) schoolId = teacher.schoolId
      else userId = user.id
    } else if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { schoolId: true, teacher: { select: { schoolId: true, userId: true } } }
      })
      if (student?.schoolId) schoolId = student.schoolId
      else if (student?.teacher && !student.teacher.schoolId) userId = student.teacher.userId
      else userId = user.id
    } else if (user.role === 'SCHOOL_ADMIN') {
      const sa = await prisma.schoolAdmin.findUnique({
        where: { userId: user.id },
        select: { schoolId: true }
      })
      schoolId = sa?.schoolId
    } else if (user.role === 'PARENT') {
      const parentWithStudents = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { students: { include: { student: { select: { schoolId: true } } } } }
      })
      if (parentWithStudents?.students.length) {
        const linkedSchoolId = parentWithStudents.students.find(s => s.student.schoolId)?.student.schoolId
        if (linkedSchoolId) schoolId = linkedSchoolId
        else userId = user.id
      } else {
        userId = user.id
      }
    } else {
      userId = user.id
    }

    if (!userId && !schoolId) return { allowed: true }
  } catch {
    return { allowed: true }
  }

  if (!userId && !schoolId) return { allowed: true }

  try {
    const { hasAccess } = await import('@/lib/subscription-service')
    const allowed = await hasAccess(userId, schoolId)
    if (!allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Your subscription has expired. Please renew to continue using this feature.', code: 'SUBSCRIPTION_EXPIRED' },
          { status: 403 }
        )
      }
    }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

export function route<T = unknown>(config: RouteConfig<T>, handler: Handler<T>) {
  return async (request: NextRequest, routeParams?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    const start = Date.now()
    try {
      const rawParams = routeParams?.params instanceof Promise ? await routeParams.params : routeParams?.params
      const resolvedParams = rawParams ? parseParams(request, rawParams) : {}

      let user: UserInfo | undefined

      if (config.auth !== 'none') {
        const roles = Array.isArray(config.auth) ? config.auth : config.auth ? [config.auth] : undefined
        if (roles) {
          user = await requireRole(roles as Role[])
        } else {
          user = await requireAuth()
        }
      }

      if (config.rateLimit !== false) {
        // Auto-apply stricter rate limiting for AI routes
        const path = request.nextUrl?.pathname || ''
        const isAIPath = path.startsWith('/api/ai/') || path.includes('/generate-') || path.includes('/auto-mark') || path.includes('/grade-')
        const rlConfig = config.rateLimit || (isAIPath ? rateLimitAI : rateLimitAPI)
        const rlKey = user?.id || getClientIdentifier(request)
        const rl = await checkRateLimit(rlKey, rlConfig)
        if (!rl.allowed) {
          const resp = NextResponse.json(
            { error: `Too many requests. Try again in ${rl.resetInSec}s.`, code: 'RATE_LIMIT_EXCEEDED' },
            { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
          )
          auditLog(request.method, request.nextUrl?.pathname || '/', user?.id, 429, Date.now() - start)
          return resp
        }
      }

      // AI usage limits — enforce per-user daily/monthly caps
      const aiPath = request.nextUrl?.pathname || ''
      const isAIEndpoint = aiPath.startsWith('/api/ai/') || aiPath.includes('/generate-') || aiPath.includes('/auto-mark') || aiPath.includes('/grade-')
      if (isAIEndpoint && user?.id && request.method === 'POST') {
        const usageCheck = await checkAIUsageAllowed(user.id)
        if (!usageCheck.allowed) {
          const resp = NextResponse.json(
            { error: usageCheck.reason, code: 'AI_USAGE_LIMIT_EXCEEDED', limits: { daily: usageCheck.limits.dailyCalls, monthly: usageCheck.limits.monthlyCalls } },
            { status: 429 }
          )
          auditLog(request.method, aiPath, user.id, 429, Date.now() - start)
          return resp
        }
      }

      if ((request.method === 'POST' || request.method === 'PUT') && user?.id) {
        const idempotencyKey = request.headers.get('Idempotency-Key')
        if (idempotencyKey) {
          const cached = await checkIdempotency(idempotencyKey, user.id)
          if (cached) {
            auditLog(request.method, request.nextUrl?.pathname || '/', user.id, 200, Date.now() - start)
            return cached.response
          }
        }
      }

      if (!config.skipSubscriptionCheck && user && config.auth !== 'none') {
        const path = request.nextUrl?.pathname || ''
        const subCheck = await checkSubscriptionAccess(user, path)
        if (!subCheck.allowed && subCheck.response) {
          auditLog(request.method, path, user.id, 403, Date.now() - start)
          return subCheck.response
        }
      }

      let body: T | undefined
      if (config.schema && request.method !== 'GET' && request.method !== 'DELETE') {
        const raw = await request.clone().json()
        body = validate(config.schema, raw)
      }

      const response = await handler(request, { user: user!, body, params: resolvedParams, session: user ? { user } : undefined })

      // Record AI usage on successful calls
      if (isAIEndpoint && user?.id && request.method === 'POST' && response.status < 400) {
        recordAIUsage(user.id).catch(() => {})
      }

      if ((request.method === 'POST' || request.method === 'PUT') && user?.id && response.status < 500) {
        const idempotencyKey = request.headers.get('Idempotency-Key')
        if (idempotencyKey) {
          setIdempotency(idempotencyKey, user.id, response)
        }
      }

      auditLog(request.method, request.nextUrl?.pathname || '/', user?.id, response.status, Date.now() - start)
      return response
    } catch (error) {
      const status = error && typeof error === 'object' && 'statusCode' in (error as any) ? (error as any).statusCode : 500
      auditLog(request.method, request.nextUrl?.pathname || '/', undefined, status, Date.now() - start)
      logger.error('Request failed', error instanceof Error ? error : undefined, {
        method: request.method,
        path: request.nextUrl?.pathname,
      })
      return handleApiError(error)
    }
  }
}

export function apiLogger(scope: string) {
  function toMeta(a: unknown): Record<string, unknown> | undefined {
    if (a && typeof a === 'object' && !Array.isArray(a)) return a as Record<string, unknown>
    return a !== undefined ? { value: a } : undefined
  }
  return {
    info: (msg: string, ...rest: unknown[]) => logger.info(`[${scope}] ${msg}`, rest.length ? toMeta(rest[0]) : undefined),
    warn: (msg: string, ...rest: unknown[]) => logger.warn(`[${scope}] ${msg}`, rest.length ? toMeta(rest[0]) : undefined),
    error: (msg: string, error?: unknown, ...rest: unknown[]) => {
      logger.error(`[${scope}] ${msg}`, error, rest.length ? toMeta(rest[0]) : undefined)
    },
  }
}
