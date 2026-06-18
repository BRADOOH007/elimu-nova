/**
 * Redis client for ElimuNova.
 *
 * Uses Upstash Redis (serverless-compatible, free tier on Vercel).
 * Falls back to a simple in-memory Map when Redis is not configured
 * so development works without any setup.
 *
 * To enable Redis:
 *   1. Create a free database at https://console.upstash.com/
 *   2. Add to .env:
 *        UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
 *        UPSTASH_REDIS_REST_TOKEN="AXxx..."
 *
 * Alternatively use any Redis URL:
 *        REDIS_URL="redis://localhost:6379"
 */

export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttlSeconds: number): Promise<void>
}

/* ── In-memory fallback (development / no Redis configured) ── */
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
}

/* ── Upstash Redis HTTP client (works in edge/serverless) ── */
class UpstashCache implements CacheClient {
  constructor(private url: string, private token: string) {}

  private async call(command: any[]): Promise<any> {
    const res = await fetch(`${this.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })
    const json = await res.json()
    return json.result
  }

  async get(key: string): Promise<string | null>                 { return this.call(['GET', key]) }
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) await this.call(['SET', key, value, 'EX', ttl])
    else     await this.call(['SET', key, value])
  }
  async del(key: string): Promise<void>                          { await this.call(['DEL', key]) }
  async incr(key: string): Promise<number>                       { return this.call(['INCR', key]) }
  async expire(key: string, ttl: number): Promise<void>          { await this.call(['EXPIRE', key, ttl]) }
}

/* ── Build the right client based on env vars ── */
function buildCache(): CacheClient {
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    console.log('[Redis] Using Upstash Redis')
    return new UpstashCache(upstashUrl, upstashToken)
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[Redis] No Redis configured in production — using in-memory cache. Add UPSTASH_REDIS_REST_URL for persistence.')
  }

  return new MemoryCache()
}

const globalForCache = globalThis as unknown as { cache: CacheClient | undefined }
export const cache: CacheClient = globalForCache.cache ?? buildCache()
if (process.env.NODE_ENV !== 'production') globalForCache.cache = cache
