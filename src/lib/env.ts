import { z } from 'zod'

/**
 * Runtime environment validation for ElimuNova.
 *
 * Loaded as a side-effect import in `next.config.ts`, so it runs every time
 * Next.js boots (dev, build, and on the serverless runtime) and catches
 * misconfiguration with a readable message instead of a silent runtime 500.
 *
 * Behaviour:
 *  - DATABASE_URL and NEXTAUTH_SECRET are hard-required in production — the
 *    app cannot boot without them. Missing → throw with an actionable message.
 *  - In dev/test, the same problems only log a warning, so a fresh clone
 *    without a local `.env` can still run `next dev`.
 *  - Optional integrations (Supabase, Stripe, AI keys, …) are format-checked
 *    when present but never crash the app — they degrade gracefully in code.
 *  - Set SKIP_ENV_CHECK=1 to bypass validation entirely (CI smoke builds).
 */

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // ── Critical ──────────────────────────────────────────────────────────
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Neon/Postgres)'),
    NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required (NextAuth signing)'),

    // ── Strongly recommended ──────────────────────────────────────────────
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL').optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  })
  .passthrough()

/** Keys that must be set in production. Everything else degrades gracefully. */
const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'NEXTAUTH_SECRET'] as const

/** Keys that power optional features — warn (don't crash) if missing in prod. */
const RECOMMENDED_IN_PRODUCTION = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const isProd = process.env.NODE_ENV === 'production'

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const key = issue.path.join('.')
      const raw = key ? process.env[key] : undefined
      const shown = raw ? ` (currently set to '${raw.slice(0, 12)}…')` : ''
      return `  • ${key}: ${issue.message}${shown}`
    })
    .join('\n')
}

const parseResult = envSchema.safeParse(process.env)

if (process.env.SKIP_ENV_CHECK === '1') {
  // Validation bypassed explicitly (e.g. CI smoke builds with no .env).
} else if (!parseResult.success) {
  const message = `[env] Invalid environment variables:\n${formatIssues(parseResult.error.issues)}`
  if (isProd) throw new Error(message)
  console.warn(message)
} else if (isProd) {
  const absent = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key])
  if (absent.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${absent.join(', ')}.\n` +
        `Set them in your hosting provider (Vercel → Settings → Environment Variables) ` +
        `or in .env for local builds.\n` +
        `Set SKIP_ENV_CHECK=1 to bypass this check.`,
    )
  }

  const missingRecommended = RECOMMENDED_IN_PRODUCTION.filter((key) => !process.env[key])
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Optional integrations not configured (${missingRecommended.join(', ')}). ` +
        `Features relying on them (e.g. file storage) will be disabled.`,
    )
  }
}

/** Typed, validated environment. Prefer these over raw process.env access. */
export const env = parseResult.success ? parseResult.data : (process.env as unknown as z.infer<typeof envSchema>)

export const isProduction = env.NODE_ENV === 'production'
