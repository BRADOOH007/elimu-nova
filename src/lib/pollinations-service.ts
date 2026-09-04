/**
 * PollinationsService — free, no-key image generation for educational content.
 *
 * Truly free (no API key, no account, no quota): https://pollinations.ai
 * Returns a reliable image (JPEG) for any prompt. Used as a cost-free fallback
 * so the platform always produces a visual, even when paid/quotad providers are
 * unavailable. Not for use at scale with heavy commercial traffic.
 */

import { fetchWithTimeout } from './fetch-utils'

// Pollinations generates on-demand asynchronously — simple prompts are fast but
// detailed educational illustrations can take 20-45s. A longer dedicated timeout
// (vs the fast 15s IMAGE preset meant for stock-photo lookups) lets the free
// path succeed instead of aborting and falling through to paid providers.
const POLLINATIONS_TIMEOUT_MS = 60_000

export interface PollinationsResult {
  url: string
  provider: string
  revisedPrompt?: string
}

export class PollinationsService {
  /**
   * Generate an image. Returns a data-URL (base64 JPEG) so the image is cached
   * and works offline, or null on failure.
   */
  static async generateImage(prompt: string, _opts: { size?: string } = {}): Promise<PollinationsResult | null> {
    const dims = this.normalizeSize(_opts.size || '1024x1024')
    const encoded = encodeURIComponent(prompt.slice(0, 600))

    // Retry with a fresh seed — Pollinations occasionally returns an empty or
    // non-image response for a given seed; a different seed usually succeeds.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const seed = Math.floor(Math.random() * 1e7)
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=${dims.w}&height=${dims.h}&nologo=true&seed=${seed}`
        const res = await fetchWithTimeout(url, {}, POLLINATIONS_TIMEOUT_MS)
        if (!res.ok) {
          console.warn(`ⓘ [Pollinations] responded ${res.status} (attempt ${attempt + 1})`)
          continue
        }

        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
          console.warn(`ⓘ [Pollinations] unexpected content-type "${contentType}" (attempt ${attempt + 1})`)
          continue
        }

        const buf = Buffer.from(await res.arrayBuffer())
        if (!buf || buf.length < 1000) {
          console.warn(`ⓘ [Pollinations] empty/invalid body (attempt ${attempt + 1})`)
          continue
        }

        return {
          url: `data:image/jpeg;base64,${buf.toString('base64')}`,
          provider: 'pollinations',
          revisedPrompt: prompt,
        }
      } catch (e: any) {
        console.warn(`[Pollinations] attempt ${attempt + 1} failed:`, e.message)
      }
    }
    return null
  }

  private static normalizeSize(size: string): { w: number; h: number } {
    const [w, h] = size.split('x').map(n => parseInt(n, 10))
    return { w: Number.isFinite(w) && w >= 256 ? w : 1024, h: Number.isFinite(h) && h >= 256 ? h : 1024 }
  }
}

export default PollinationsService
