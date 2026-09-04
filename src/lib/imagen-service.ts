/**
 * ImagenService — Google Imagen / Nano-Banana image generation via the Gemini API.
 * Uses the same Google AI key already stored for Gemini (Gemini & Imagen share
 * the Google AI API key), so no extra credentials are needed.
 *
 * Image-capable Gemini models use the `:generateContent` endpoint and return the
 * image as base64 `inlineData`. Falls back to the legacy `:predict` endpoint for
 * classic Imagen models.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */

import { fetchWithTimeout, TIMEOUTS } from './fetch-utils'

// Ordered best-first. `gemini-*-image` / `nano-banana` are image-capable
// Gemini models; the first that responds with an image wins.
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'nano-banana-pro-preview',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image-preview',
]

export interface ImagenResult {
  url: string
  provider: string
  revisedPrompt?: string
}

export class ImagenService {
  static async generateImage(
    prompt: string,
    _opts: { quality?: string; size?: string } = {},
  ): Promise<ImagenResult | null> {
    const apiKey = await this.getGoogleKey()
    if (!apiKey) return null

    // 1. Try image-capable Gemini models via generateContent
    for (const model of IMAGE_MODELS) {
      const out = await this.tryGenerateContent(model, prompt, apiKey)
      if (out) return out
    }

    // 2. Legacy Imagen :predict endpoint
    return this.tryImagenPredict(prompt, apiKey)
  }

  private static async tryGenerateContent(
    model: string,
    prompt: string,
    apiKey: string,
  ): Promise<ImagenResult | null> {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
        },
        TIMEOUTS.IMAGE,
      )

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        // Quota / not-found: silently continue to next model
        console.warn(`[Imagen] ${model} ${res.status}`, t.slice(0, 120))
        return null
      }

      const data = await res.json()
      const parts = data?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        const inline = part?.inlineData?.data
        if (inline) {
          const mime = part.inlineData?.mimeType || 'image/png'
          const url = mime.includes('png')
            ? `data:image/png;base64,${inline}`
            : `data:${mime};base64,${inline}`
          return { url, provider: model, revisedPrompt: prompt }
        }
      }
    } catch (e: any) {
      console.warn(`[Imagen] ${model} failed:`, e.message)
    }
    return null
  }

  private static async tryImagenPredict(prompt: string, apiKey: string): Promise<ImagenResult | null> {
    try {
      const res = await fetchWithTimeout(
        'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
        },
        TIMEOUTS.IMAGE,
      )
      if (res.ok) {
        const data = await res.json()
        const raw = data?.predictions?.[0]?.bytesBase64Encoded
        if (raw) return { url: `data:image/png;base64,${raw}`, provider: 'imagen', revisedPrompt: prompt }
      }
    } catch (e: any) {
      console.warn('[Imagen] predict failed:', e.message)
    }
    return null
  }

  /**
   * Resolve the Google AI key from env or the DB AI-key chain (Gemini key).
   * Imagen + Gemini use the same Google AI API key.
   */
  private static async getGoogleKey(): Promise<string | null> {
    const { getKey } = await import('./ai-provider')
    const key = await getKey('GEMINI_API_KEY')
    return key && key.trim() ? key.trim() : null
  }
}

export default ImagenService
