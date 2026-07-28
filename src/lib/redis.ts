// ──────────────────────────────────────────────────────────────
// Cache layer — auto-selects between Upstash Redis (production)
// and in-memory fallback (dev/test). Used for rate limiting,
// idempotency keys, and general caching.
//
// To enable Redis: set REDIS_URL env var (Upstash, Redis Cloud)
// Without it, MemoryCache is used (not distributed across VMs).
// ──────────────────────────────────────────────────────────────

import type Redis from 'ioredis'

// CacheClient interface — all consumers depend on this abstraction
export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttlSeconds: number): Promise<void>
  ttl(key: string): Promise<number>
  ping(): Promise<string>
}

// ── In-memory fallback (used when REDIS_URL is not set) ──
class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number | null }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async del(key: string): Promise<void> { this.store.delete(key) }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10)
    const next = current + 1
    const entry = this.store.get(key)
    await this.set(key, String(next), entry?.expiresAt ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : undefined)
    return next
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key)
    if (entry) {
      this.store.set(key, { value: entry.value, expiresAt: Date.now() + ttlSeconds * 1000 })
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key)
    if (!entry || !entry.expiresAt) return -1
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000)
    return remaining > 0 ? remaining : -1
  }

  async ping(): Promise<string> { return 'PONG' }
}

// ── Redis client factory (Upstash / standard Redis with TLS) ──
function createRedisClient(): CacheClient {
  const url = process.env.REDIS_URL
  if (!url) return new MemoryCache()

  // Dynamic import so the module never errors if ioredis is missing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IORedis = require('ioredis') as typeof Redis

  const isTLS = url.startsWith('rediss://') || url.includes('upstash.io')

  const client = new IORedis(url, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times: number) => {
      if (times > 2) return null
      return Math.min(times * 200, 1000)
    },
    connectTimeout: 5000,
    lazyConnect: true,
    ...(isTLS ? { tls: {} } : {}),
  } as any)

  client.connect()

  return {
    async get(key: string) {
      const val = await client.get(key)
      return val ?? null
    },
    async set(key: string, value: string, ttlSeconds?: number) {
      if (ttlSeconds) await client.set(key, value, 'EX', ttlSeconds)
      else await client.set(key, value)
    },
    async del(key: string) { await client.del(key) },
    async incr(key: string) { return client.incr(key) },
    async expire(key: string, ttlSeconds: number) { await client.expire(key, ttlSeconds) },
    async ttl(key: string) { return client.ttl(key) },
    async ping() { return client.ping() },
  }
}

// Global singleton — preserves instance across hot-reloads in dev
const globalForCache = globalThis as unknown as { cache: CacheClient | undefined }
export const cache: CacheClient = globalForCache.cache ?? createRedisClient()
if (process.env.NODE_ENV !== 'production') globalForCache.cache = cache
