import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { emailService } from '@/lib/email-service'
import type { Prisma } from '@prisma/client'

export type IncidentCategory = 'DATABASE' | 'AI_SERVICE' | 'API_ERROR' | 'ROUTE_404' | 'RATE_LIMIT' | 'SECURITY' | 'PAYMENT' | 'PERFORMANCE' | 'OTHER'
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

const SEVERITY_ORDER: IncidentSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const LOG_DERIVED_CATEGORIES: IncidentCategory[] = ['API_ERROR', 'ROUTE_404', 'RATE_LIMIT', 'PERFORMANCE', 'SECURITY']

interface UpsertIncidentInput {
  dedupeKey: string
  category: IncidentCategory
  severity: IncidentSeverity
  title: string
  description: string
  source?: string
  metadata?: Record<string, unknown>
}

export async function recordApiLog(input: {
  method: string
  path: string
  status: number
  durationMs: number
  userId?: string
  ipAddress?: string
}) {
  try {
    await prisma.apiLog.create({
      data: {
        method: input.method,
        path: input.path.slice(0, 500),
        status: input.status,
        durationMs: input.durationMs,
        userId: input.userId,
        ipAddress: input.ipAddress ? input.ipAddress.slice(0, 64) : undefined,
      },
    })
  } catch (e) {
    logger.warn('Failed to record api log', { error: e instanceof Error ? e.message : String(e) })
  }
}

async function notifySuperAdmins(incident: { title: string; description: string; severity: string }) {
  try {
    const superAdmins = await prisma.superAdmin.findMany({ include: { user: { select: { id: true, email: true, firstName: true } } } })
    const recipientIds = superAdmins.map(sa => sa.user.id).filter(Boolean)
    if (recipientIds.length) {
      await prisma.notification.createMany({
        data: recipientIds.map(userId => ({
          title: `[${incident.severity}] ${incident.title}`,
          message: incident.description,
          type: 'warning',
          userId,
        })),
      })
    }
    for (const sa of superAdmins) {
      if (sa.user.email) {
        emailService
          .sendIncidentAlertEmail(sa.user.email, sa.user.firstName || 'Super Admin', incident.title, incident.description, incident.severity)
          .catch(() => {})
      }
    }
  } catch (e) {
    logger.error('Failed to notify super admins of incident', e)
  }
}

export async function upsertIncident(input: UpsertIncidentInput): Promise<{ isNew: boolean; escalated: boolean }> {
  try {
    const existing = await prisma.systemIncident.findUnique({
      where: { dedupeKey_status: { dedupeKey: input.dedupeKey, status: 'OPEN' } },
    })

    if (existing) {
      const currentIdx = SEVERITY_ORDER.indexOf(existing.severity as IncidentSeverity)
      const nextIdx = SEVERITY_ORDER.indexOf(input.severity)
      const escalated = nextIdx > currentIdx
      await prisma.systemIncident.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          lastSeen: new Date(),
          severity: escalated ? input.severity : existing.severity,
          title: escalated ? input.title : existing.title,
          description: input.description,
          source: input.source ?? existing.source,
          ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
        },
      })
      if (escalated && (input.severity === 'HIGH' || input.severity === 'CRITICAL')) {
        await notifySuperAdmins({ title: input.title, description: input.description, severity: input.severity })
      }
      return { isNew: false, escalated }
    }

    await prisma.systemIncident.create({
      data: {
        dedupeKey: input.dedupeKey,
        category: input.category,
        severity: input.severity,
        title: input.title,
        description: input.description,
        source: input.source,
        ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
        count: 1,
      },
    })

    if (input.severity === 'HIGH' || input.severity === 'CRITICAL') {
      await notifySuperAdmins({ title: input.title, description: input.description, severity: input.severity })
    }
    return { isNew: true, escalated: false }
  } catch (e) {
    logger.error('Failed to upsert incident', e)
    return { isNew: false, escalated: false }
  }
}

async function autoResolveStaleIncidents() {
  const cutoff = new Date(Date.now() - 12 * 60 * 1000)
  try {
    const stale = await prisma.systemIncident.findMany({
      where: {
        status: 'OPEN',
        category: { in: LOG_DERIVED_CATEGORIES },
        lastSeen: { lt: cutoff },
      },
    })
    for (const incident of stale) {
      await prisma.systemIncident.update({
        where: { id: incident.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: 'SYSTEM_AUTO' },
      })
    }
    return stale.length
  } catch (e) {
    logger.error('Failed to auto-resolve stale incidents', e)
    return 0
  }
}

export async function runHealthCheck() {
  const summary: { checked: string[]; newIncidents: number; escalated: number; autoResolved: number } = {
    checked: [],
    newIncidents: 0,
    escalated: 0,
    autoResolved: 0,
  }

  const since = new Date(Date.now() - 10 * 60 * 1000)

  try {
    await prisma.$queryRaw`SELECT 1`
    summary.checked.push('database')
  } catch (e) {
    summary.checked.push('database')
    const r = await upsertIncident({
      dedupeKey: 'db:probe',
      category: 'DATABASE',
      severity: 'CRITICAL',
      title: 'Database connection failure',
      description: 'The health check could not reach the database (SELECT 1 probe failed).',
      source: 'prisma',
      metadata: { error: e instanceof Error ? e.message : String(e) },
    })
    if (r.isNew) summary.newIncidents++
    if (r.escalated) summary.escalated++
  }

  try {
    const apiErrors = await prisma.apiLog.groupBy({
      by: ['path'],
      where: { status: { gte: 500 }, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
    })
    for (const row of apiErrors) {
      const r = await upsertIncident({
        dedupeKey: `api_error:${row.path}`,
        category: 'API_ERROR',
        severity: 'HIGH',
        title: `Server errors on ${row.path}`,
        description: `${row._count._all} 5xx response(s) on ${row.path} in the last 10 minutes.`,
        source: row.path,
        metadata: { count: row._count._all, windowMin: 10 },
      })
      if (r.isNew) summary.newIncidents++
      if (r.escalated) summary.escalated++
    }
    summary.checked.push('api-5xx')
  } catch (e) {
    logger.error('Health check failed scanning 5xx', e)
  }

  try {
    const notFound = await prisma.apiLog.groupBy({
      by: ['path'],
      where: { status: 404, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
    })
    for (const row of notFound) {
      const r = await upsertIncident({
        dedupeKey: `route_404:${row.path}`,
        category: 'ROUTE_404',
        severity: 'LOW',
        title: `Repeated 404 on ${row.path}`,
        description: `${row._count._all} request(s) to missing route ${row.path} in the last 10 minutes.`,
        source: row.path,
        metadata: { count: row._count._all, windowMin: 10 },
      })
      if (r.isNew) summary.newIncidents++
      if (r.escalated) summary.escalated++
    }
    summary.checked.push('api-404')
  } catch (e) {
    logger.error('Health check failed scanning 404s', e)
  }

  try {
    const rateLimited = await prisma.apiLog.count({
      where: { status: 429, createdAt: { gte: since } },
    })
    if (rateLimited >= 10) {
      const r = await upsertIncident({
        dedupeKey: 'rate_limit:global',
        category: 'RATE_LIMIT',
        severity: 'MEDIUM',
        title: 'Rate limiting spike',
        description: `${rateLimited} rate-limit rejections (429) in the last 10 minutes.`,
        metadata: { count: rateLimited, windowMin: 10 },
      })
      if (r.isNew) summary.newIncidents++
      if (r.escalated) summary.escalated++
    }
    summary.checked.push('rate-limit')
  } catch (e) {
    logger.error('Health check failed scanning 429s', e)
  }

  try {
    const sinceSec = new Date(Date.now() - 30 * 60 * 1000)
    const bruteForce = await prisma.securityLog.count({
      where: { eventType: 'BRUTE_FORCE_ATTEMPT', createdAt: { gte: sinceSec } },
    })
    if (bruteForce >= 3) {
      const r = await upsertIncident({
        dedupeKey: 'security:brute_force',
        category: 'SECURITY',
        severity: 'HIGH',
        title: 'Brute force / login abuse detected',
        description: `${bruteForce} brute-force attempt(s) logged in the last 30 minutes.`,
        metadata: { count: bruteForce, windowMin: 30 },
      })
      if (r.isNew) summary.newIncidents++
      if (r.escalated) summary.escalated++
    }

    const criticalSecurity = await prisma.securityLog.findMany({
      where: {
        eventType: { in: ['SUSPICIOUS_ACTIVITY', 'SYSTEM_INTRUSION', 'UNAUTHORIZED_ACCESS', 'API_ABUSE'] },
        createdAt: { gte: sinceSec },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
    for (const log of criticalSecurity) {
      const r = await upsertIncident({
        dedupeKey: `security:${log.eventType}`,
        category: 'SECURITY',
        severity: log.eventType === 'SYSTEM_INTRUSION' ? 'CRITICAL' : 'HIGH',
        title: `${log.eventType.replace(/_/g, ' ')} detected`,
        description: log.description,
        source: log.ipAddress || undefined,
        metadata: { userId: log.userId, schoolId: log.schoolId, ipAddress: log.ipAddress },
      })
      if (r.isNew) summary.newIncidents++
      if (r.escalated) summary.escalated++
    }
    summary.checked.push('security')
  } catch (e) {
    logger.error('Health check failed scanning security log', e)
  }

  summary.autoResolved = await autoResolveStaleIncidents()
  return summary
}

export async function resolveIncident(id: string, resolvedBy: string) {
  await prisma.systemIncident.update({
    where: { id },
    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy },
  })
}

export async function acknowledgeIncident(id: string) {
  await prisma.systemIncident.update({ where: { id }, data: { status: 'ACKNOWLEDGED' } })
}
