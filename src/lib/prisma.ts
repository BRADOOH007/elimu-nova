import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma client with connection pool configuration.
 *
 * connection_limit: max DB connections this instance holds open.
 *   - Development: 5 (generous for hot-reload cycles)
 *   - Production:  3 per serverless instance (Vercel spins up many instances)
 *     → 100 serverless instances × 3 = 300 total connections well within Postgres limits
 *
 * pool_timeout: seconds to wait for a connection before throwing.
 * connect_timeout: seconds to wait for initial DB connection.
 * socket_timeout: seconds to wait for a query response.
 */
function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  if (!url) return url

  const isProd = process.env.NODE_ENV === 'production'
  const limit  = isProd ? 3 : 5

  // Avoid adding params twice
  if (url.includes('connection_limit')) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}connection_limit=${limit}&pool_timeout=30&connect_timeout=10`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: buildDatabaseUrl() },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  })

// In development, persist the client across hot-reloads to avoid
// exhausting connections on every file save.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
