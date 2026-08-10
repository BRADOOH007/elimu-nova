// ──────────────────────────────────────────────────────────────
// Cache layer — auto-selects between Upstash Redis (production)
// and in-memory fallback (dev/test). Used for rate limiting,
// idempotency keys, and general caching.
//
// To enable Redis: set REDIS_URL env var (Upstash, Redis Cloud)
// Without it, MemoryCache is used (not distributed across VMs).
//
// SAFETY: Every Redis command is wrapped with a 3s deadline.
// If Redis is unreachable or slow, we fall back to memory cache
// automatically — no hanging requests, no broken logins.
// ──────────────────────────────────────────────────────────────

import type Redis from 'ioredis'

const CMD_TIMEOUT_MS = 3000

const TIMEOUT_SIGNAL = Symbol('command_timeout')

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(TIMEOUT_SIGNAL), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

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

// ── Redis wrapper with per-command deadlines ──
// Every method races the ioredis command against a 3s timer.
// If Redis is unreachable, the request continues with in-memory
// fallback instead of hanging forever.
class DeadlineRedis implements CacheClient {
  private client: Redis
  private connected = false
  private degraded = false
  private fallback = new MemoryCache()

  constructor(client: Redis) {
    this.client = client
    client.on('connect', () => { this.connected = true })
    client.on('error', () => { this.degraded = true })
  }

  private async cmd<T>(fn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> {
    if (this.degraded) return fallbackFn()
    try {
      return await withDeadline(fn(), CMD_TIMEOUT_MS)
    } catch (e) {
      if (e === TIMEOUT_SIGNAL || this.isConnectionError(e)) {
        console.warn(`[cache] Redis command timed out — falling back to in-memory cache`)
        this.degraded = true
        return fallbackFn()
      }
      throw e
    }
  }

  private isConnectionError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e)
    return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout|connect/i.test(msg)
  }

  async get(key: string) {
    return this.cmd(() => this.client.get(key).then(v => v ?? null), () => this.fallback.get(key))
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    return this.cmd(
      () => ttlSeconds ? this.client.set(key, value, 'EX', ttlSeconds) : this.client.set(key, value),
      () => this.fallback.set(key, value, ttlSeconds),
    )
  }

  async del(key: string) {
    return this.cmd(() => this.client.del(key), () => this.fallback.del(key))
  }

  async incr(key: string) {
    return this.cmd(() => this.client.incr(key), () => this.fallback.incr(key))
  }

  async expire(key: string, ttlSeconds: number) {
    return this.cmd(() => this.client.expire(key, ttlSeconds), () => this.fallback.expire(key, ttlSeconds))
  }

  async ttl(key: string) {
    return this.cmd(() => this.client.ttl(key), () => this.fallback.ttl(key))
  }

  async ping() {
    return this.cmd(() => this.client.ping(), () => 'FALLBACK')
  }
}

// ── Redis client factory (Upstash / standard Redis with TLS) ──
function createRedisClient(): CacheClient {
  const url = process.env.REDIS_URL
  if (!url) return new MemoryCache()

  try {
    const IORedis = require('ioredis') as typeof Redis
    const isTLS = url.startsWith('rediss://') || url.includes('upstash.io')

    const client = new IORedis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times: number) => {
        if (times > 2) return null
        return Math.min(times * 200, 1000)
      },
      connectTimeout: 5000,
      enableOfflineQueue: false,
      ...(isTLS ? { tls: {} } : {}),
    } as any)

    return new DeadlineRedis(client)
  } catch (e) {
    console.warn(`[cache] Failed to create Redis client — falling back to in-memory cache`, e)
    return new MemoryCache()
  }
}

// Global singleton — preserves instance across hot-reloads in dev
const globalForCache = globalThis as unknown as { cache: CacheClient | undefined }
export const cache: CacheClient = globalForCache.cache ?? createRedisClient()
if (process.env.NODE_ENV !== 'production') globalForCache.cache = cache
