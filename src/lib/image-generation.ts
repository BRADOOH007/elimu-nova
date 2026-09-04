import { getKey } from '@/lib/ai-provider'

export interface ImageGenerationRequest {
  prompt: string
  style?: 'natural' | 'vivid'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  provider?: 'auto' | 'dalle' | 'stability'
}

export interface ImageGenerationResponse {
  url: string
  provider: string
  revisedPrompt?: string
  metadata?: any
}

export class ImageGenerationService {
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const provider = request.provider || 'auto'

    // 0. Pollinations — free, no API key, no quota, always available. Tried
    // first so the platform always produces a real image quickly and at no
    // cost, then falls back to premium/paid providers when higher quality is
    // needed, then to an SVG placeholder as a last resort.
    try {
      const { PollinationsService } = await import('./pollinations-service')
      const poll = await PollinationsService.generateImage(request.prompt, { size: request.size })
      if (poll?.url) return poll as ImageGenerationResponse
    } catch (e: any) {
      console.warn('[ImageGen] Pollinations failed:', e.message)
    }

    // Explicit provider selection (only relevant when a non-auto provider is requested)
    if (provider === 'stability') {
      const result = await this.generateStability(request)
      if (result.provider !== 'placeholder') return result
    }

    if (provider !== 'stability') {
      const result = await this.generateDalle(request)
      if (result.provider !== 'placeholder') return result
    }

    if (provider === 'auto') {
      const result = await this.generateStability(request)
      if (result.provider !== 'placeholder') return result
    }

    return this.placeholder(request.prompt)
  }

  private async generateDalle(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = await getKey('OPENAI_DALLE_API_KEY') || ''
    if (!apiKey || apiKey.startsWith('sk-or-')) return this.placeholder(request.prompt)

    try {
      const { OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey })
      const enhancedPrompt = this.enhancePromptForEducation(request.prompt, request.style)

      const response = await openai.images.generate({
        model:   'dall-e-3',
        prompt:  enhancedPrompt,
        n:       1,
        size:    request.size || '1024x1024',
        quality: request.quality || 'standard',
        style:   request.style || 'natural',
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) throw new Error('No image URL returned from DALL-E')

      return {
        url:           imageUrl,
        provider:      'openai-dalle-3',
        revisedPrompt: response.data?.[0]?.revised_prompt,
        metadata: {
          model: 'dall-e-3',
          size:  request.size || '1024x1024',
          quality: request.quality || 'standard',
          style: request.style || 'natural',
          originalPrompt: request.prompt,
          enhancedPrompt,
        },
      }
    } catch (error) {
      console.error('[ImageGen] DALL-E failed:', error instanceof Error ? error.message : error)
      return this.placeholder(request.prompt)
    }
  }

  private async generateStability(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = await getKey('STABILITY_API_KEY')
    if (!apiKey) {
      console.warn('[ImageGen] No Stability AI key configured')
      return this.placeholder(request.prompt)
    }

    try {
      const aspectRatioMap: Record<string, string> = {
        '1024x1024': '1:1',
        '1792x1024': '16:9',
        '1024x1792': '9:16',
      }
      const aspectRatio = aspectRatioMap[request.size || '1024x1024'] || '1:1'
      const enhancedPrompt = this.enhancePromptForEducation(request.prompt, request.style)

      const formData = new FormData()
      formData.append('prompt', enhancedPrompt)
      formData.append('aspect_ratio', aspectRatio)
      formData.append('output_format', 'png')
      formData.append('mode', 'text-to-image')

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Stability AI error ${response.status}: ${errText}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const base64 = buffer.toString('base64')
      const url = `data:image/png;base64,${base64}`

      return {
        url,
        provider: 'stability-ai',
        revisedPrompt: enhancedPrompt,
        metadata: {
          model: 'sd3',
          aspectRatio,
          originalPrompt: request.prompt,
          enhancedPrompt,
        },
      }
    } catch (error) {
      console.error('[ImageGen] Stability AI failed:', error instanceof Error ? error.message : error)
      return this.placeholder(request.prompt)
    }
  }

  /** Return an SVG data-URI placeholder — always succeeds */
  private placeholder(prompt: string): ImageGenerationResponse {
    const text = (prompt || 'Educational Image').slice(0, 55)
    const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e8f4fd"/>
      <rect x="30" y="30" width="964" height="964" rx="16" fill="none" stroke="#90c4e8" stroke-width="4"/>
      <circle cx="512" cy="420" r="80" fill="#b3d9f5" opacity="0.6"/>
      <text x="512" y="580" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" fill="#2c6e9e" font-weight="bold">🎨 ElimuNova AI</text>
      <text x="512" y="640" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#4a8cbb">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
    </svg>`
    return {
      url:      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      provider: 'placeholder',
      revisedPrompt: prompt,
      metadata: { source: 'svg-placeholder' },
    }
  }

  /**
   * Generate image with automatic prompt enhancement
   */
  async generate(
    prompt: string,
    options?: {
      style?: 'natural' | 'vivid'
      size?: '1024x1024' | '1792x1024' | '1024x1792'
      quality?: 'standard' | 'hd'
    }
  ): Promise<ImageGenerationResponse> {
    return this.generateImage({ prompt, ...options })
  }

  /**
   * Enhance prompts for educational content
   */
  private enhancePromptForEducation(prompt: string, style?: string): string {
    // Add educational context and quality improvements
    const educationalEnhancements = [
      'educational illustration',
      'clean and clear design',
      'appropriate for students',
      'professional quality',
      'well-lit and vibrant'
    ]

    // Avoid inappropriate content
    const safetyFilters = [
      'safe for all ages',
      'educational content',
      'appropriate for classroom use'
    ]

    const styleEnhancements = style === 'vivid' 
      ? ['colorful', 'engaging', 'dynamic']
      : ['clean', 'professional', 'clear']

    const allEnhancements = [
      ...educationalEnhancements,
      ...safetyFilters,
      ...styleEnhancements
    ]

    return `${prompt}, ${allEnhancements.join(', ')}`
  }

  /**
   * Generate educational image with specific context
   */
  async generateEducationalImage(
    subject: string,
    topic: string,
    description: string,
    options?: {
      style?: 'natural' | 'vivid'
      size?: '1024x1024' | '1792x1024' | '1024x1792'
      quality?: 'standard' | 'hd'
    }
  ): Promise<ImageGenerationResponse> {
    const educationalPrompt = `Educational illustration for ${subject} - ${topic}: ${description}. 
    Create a clear, informative, and engaging visual that helps students understand the concept. 
    The image should be appropriate for educational use, well-designed, and visually appealing.`

    return await this.generate(educationalPrompt, options)
  }
}

// Create singleton instance
export const imageGenerationService = new ImageGenerationService()

// Export for backward compatibility
export default imageGenerationService