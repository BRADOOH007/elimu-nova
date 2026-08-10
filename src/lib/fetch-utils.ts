/**
 * Shared fetch wrapper with AbortController timeout.
 * Use this for ANY external API call to prevent hanging requests.
 *
 * Usage:
 *   const data = await fetchWithTimeout('https://api.example.com', { method: 'POST', body: JSON.stringify(payload) }, 30000)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15_000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Race a promise against a timeout. If the promise doesn't resolve
 * within timeoutMs, the returned promise rejects with 'TIMEOUT'.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

// Pre-configured timeout presets
export const TIMEOUTS = {
  AI: 60_000,         // AI generation — LLMs can be slow
  IMAGE: 15_000,      // Stock image search
  PAYMENT: 20_000,    // M-Pesa, PayPal — critical
  DEFAULT: 10_000,    // General external APIs
  FAST: 5_000,        // Quick lookups (Zoom, Twilio, Email)
} as const
