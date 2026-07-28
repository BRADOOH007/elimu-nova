import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Builds the database URL with connection pool params suited for serverless/Neon.
 * Neon closes idle connections after ~5 minutes — we keep limits low and let
 * Prisma reconnect automatically.
 */
function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  if (!url) return url
  // Already parameterised — skip
  if (url.includes('connection_limit')) return url

  const isProd    = process.env.NODE_ENV === 'production'
  const limit     = isProd ? 15 : 5
  const separator = url.includes('?') ? '&' : '?'

  // pgbouncer=true is required for Neon / PgBouncer pooled connections
  const extras = url.includes('neon.tech') ? `&pgbouncer=true&sslmode=require` : ''
  return `${url}${separator}connection_limit=${limit}&pool_timeout=30&connect_timeout=15${extras}`
}

function createClient() {
  return new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl() } },
    log: ['error'],
  })
}

// Global singleton — preserves instance across Next.js hot-reloads in dev
export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * withRetry — wraps a Prisma call and retries once on connection-closed errors.
 * Neon/Supabase serverless connections can drop silently; a single retry is
 * enough to recover without impacting performance.
 *
 * Usage:
 *   const users = await withRetry(() => prisma.user.findMany())
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const prismaErr = err as { message?: string; code?: string }
    const msg = prismaErr.message ?? String(err)
    const isConnectionError =
      msg.includes('Connection closed') ||
      msg.includes('kind: Closed') ||
      msg.includes('Server has closed the connection') ||
      msg.includes('ECONNRESET') ||
      msg.includes('Connection reset') ||
      prismaErr.code === 'P1001' ||
      prismaErr.code === 'P1002' ||
      prismaErr.code === 'P1008' ||
      prismaErr.code === 'P1017'

    if (isConnectionError && retries > 0) {
      console.warn('[Prisma] Connection dropped — retrying query once…')
      // Give the connection pool a moment to recover
      await new Promise(r => setTimeout(r, 200))
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}
