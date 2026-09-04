/**
 * AI Usage Tracking & Limits
 * Enforces per-user daily/monthly AI call limits based on subscription tier.
 * Tracks token usage for cost monitoring.
 */
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface AIUsageLimits {
  dailyCalls: number
  monthlyCalls: number
  maxTokensPerCall: number
  maxTokensPerDay: number
}

// Default limits by package name (lowercase match)
const TIER_LIMITS: Record<string, AIUsageLimits> = {
  free: { dailyCalls: 10, monthlyCalls: 200, maxTokensPerCall: 1000, maxTokensPerDay: 5000 },
  freemium: { dailyCalls: 10, monthlyCalls: 200, maxTokensPerCall: 1000, maxTokensPerDay: 5000 },
  basic: { dailyCalls: 30, monthlyCalls: 800, maxTokensPerCall: 2000, maxTokensPerDay: 20000 },
  starter: { dailyCalls: 30, monthlyCalls: 800, maxTokensPerCall: 2000, maxTokensPerDay: 20000 },
  standard: { dailyCalls: 60, monthlyCalls: 2000, maxTokensPerCall: 3000, maxTokensPerDay: 50000 },
  pro: { dailyCalls: 100, monthlyCalls: 5000, maxTokensPerCall: 4000, maxTokensPerDay: 100000 },
  premium: { dailyCalls: 200, monthlyCalls: 10000, maxTokensPerCall: 4000, maxTokensPerDay: 200000 },
  enterprise: { dailyCalls: 500, monthlyCalls: 50000, maxTokensPerCall: 4000, maxTokensPerDay: 500000 },
}

const DEFAULT_LIMITS: AIUsageLimits = {
  dailyCalls: 10,
  monthlyCalls: 200,
  maxTokensPerCall: 1000,
  maxTokensPerDay: 5000,
}

function getTodayKey(userId: string): string {
  const d = new Date()
  return `ai-usage:${userId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonthKey(userId: string): string {
  const d = new Date()
  return `ai-usage:${userId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Get the AI usage limits for a user based on their subscription tier */
export async function getUsageLimits(userId: string): Promise<AIUsageLimits> {
  try {
    // Check cache first
    const cached = await cache.get(`ai-limits:${userId}`)
    if (cached) return JSON.parse(cached)

    // Find user's active subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!user) return DEFAULT_LIMITS

    // SUPER_ADMIN gets unlimited
    if (user.role === 'SUPER_ADMIN') {
      const unlimited: AIUsageLimits = { dailyCalls: 999999, monthlyCalls: 999999, maxTokensPerCall: 4000, maxTokensPerDay: 9999999 }
      await cache.set(`ai-limits:${userId}`, JSON.stringify(unlimited), 3600).catch(() => {})
      return unlimited
    }

    // Find active subscription — school plan first, then the user's own plan
    // (independent parents / senior students / freelancers subscribe by userId).
    let subscription: any = null

    const schoolSub = async (schoolId: string | null | undefined) => {
      if (!schoolId) return null
      return prisma.subscription.findFirst({
        where: { schoolId, status: 'ACTIVE' },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      })
    }
    const ownSub = async () => {
      return prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (user.role === 'TEACHER' || user.role === 'STUDENT' || user.role === 'PARENT' || user.role === 'SENIOR_STUDENT' || user.role === 'SENIOR_TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { schoolId: true } }).catch(() => null)
      const student = await prisma.student.findUnique({ where: { userId }, select: { schoolId: true } }).catch(() => null)
      const schoolId = teacher?.schoolId || student?.schoolId
      subscription = (await schoolSub(schoolId)) || (await ownSub())
    } else if (user.role === 'SCHOOL_ADMIN') {
      const sa = await prisma.schoolAdmin.findUnique({ where: { userId }, select: { schoolId: true } }).catch(() => null)
      subscription = (await schoolSub(sa?.schoolId)) || (await ownSub())
    }

    if (!subscription?.package) {
      await cache.set(`ai-limits:${userId}`, JSON.stringify(DEFAULT_LIMITS), 3600).catch(() => {})
      return DEFAULT_LIMITS
    }

    const packageName = subscription.package.name.toLowerCase()
    let limits = DEFAULT_LIMITS
    for (const [key, value] of Object.entries(TIER_LIMITS)) {
      if (packageName.includes(key)) {
        limits = value
        break
      }
    }

    // Custom plan names (e.g. "Senior GED Plan", "Single Child Plan", tutoring
    // plans) don't contain a tier keyword. If the user is NOT on a free plan,
    // give them at least the "basic" (paid) limits so a paying customer is
    // never throttled to free-tier AI limits. Only purely-free plans (name or
    // price 0) keep the default free limits.
    if (limits === DEFAULT_LIMITS) {
      const isFree =
        packageName.includes('free') ||
        packageName.includes('trial') ||
        (subscription.package.price || 0) === 0
      if (!isFree) limits = TIER_LIMITS.basic
    }

    await cache.set(`ai-limits:${userId}`, JSON.stringify(limits), 3600).catch(() => {})
    return limits
  } catch {
    return DEFAULT_LIMITS
  }
}

/** Check if user is within their AI usage limits */
export async function checkAIUsageAllowed(userId: string): Promise<{ allowed: boolean; reason?: string; limits: AIUsageLimits }> {
  const limits = await getUsageLimits(userId)

  const dailyKey = getTodayKey(userId)
  const monthlyKey = getMonthKey(userId)

  try {
    const [dailyCount, monthlyCount] = await Promise.all([
      cache.get(dailyKey).then(v => v ? parseInt(v as string, 10) : 0),
      cache.get(monthlyKey).then(v => v ? parseInt(v as string, 10) : 0),
    ])

    if (dailyCount >= limits.dailyCalls) {
      return { allowed: false, reason: `Daily AI limit reached (${limits.dailyCalls}/day). Resets at midnight.`, limits }
    }
    if (monthlyCount >= limits.monthlyCalls) {
      return { allowed: false, reason: `Monthly AI limit reached (${limits.monthlyCalls}/month). Resets next month.`, limits }
    }

    return { allowed: true, limits }
  } catch {
    // Fail open
    return { allowed: true, limits }
  }
}

/** Record an AI call (increment counters) */
export async function recordAIUsage(userId: string, tokensUsed: number = 0): Promise<void> {
  const dailyKey = getTodayKey(userId)
  const monthlyKey = getMonthKey(userId)

  try {
    await Promise.all([
      cache.incr(dailyKey).then(async (count) => {
        if (count === 1) await cache.expire(dailyKey, 86400) // 24h TTL
      }),
      cache.incr(monthlyKey).then(async (count) => {
        if (count === 1) await cache.expire(monthlyKey, 31 * 86400) // 31 days TTL
      }),
    ])

    // Track token usage if provided
    if (tokensUsed > 0) {
      const tokenKey = `ai-tokens:${userId}:${new Date().toISOString().slice(0, 7)}`
      try {
        const current = await cache.get(tokenKey).then(v => v ? parseInt(v as string, 10) : 0)
        await cache.set(tokenKey, String(current + tokensUsed), 31 * 86400)
      } catch { /* non-fatal */ }
    }
  } catch { /* non-fatal */ }
}

/** Get current usage stats for a user */
export async function getAIUsageStats(userId: string): Promise<{ daily: number; dailyLimit: number; monthly: number; monthlyLimit: number; tokensThisMonth: number }> {
  const limits = await getUsageLimits(userId)
  const dailyKey = getTodayKey(userId)
  const monthlyKey = getMonthKey(userId)
  const tokenKey = `ai-tokens:${userId}:${new Date().toISOString().slice(0, 7)}`

  try {
    const [daily, monthly, tokens] = await Promise.all([
      cache.get(dailyKey).then(v => v ? parseInt(v as string, 10) : 0),
      cache.get(monthlyKey).then(v => v ? parseInt(v as string, 10) : 0),
      cache.get(tokenKey).then(v => v ? parseInt(v as string, 10) : 0),
    ])

    return {
      daily,
      dailyLimit: limits.dailyCalls,
      monthly,
      monthlyLimit: limits.monthlyCalls,
      tokensThisMonth: tokens,
    }
  } catch {
    return { daily: 0, dailyLimit: limits.dailyCalls, monthly: 0, monthlyLimit: limits.monthlyCalls, tokensThisMonth: 0 }
  }
}
