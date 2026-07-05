/**
 * Image Generation Service - Using OpenAI DALL-E 3 exclusively
 */

export interface ImageGenerationRequest {
  prompt: string
  style?: 'natural' | 'vivid'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResponse {
  url: string
  provider: string
  revisedPrompt?: string
  metadata?: any
}

export class ImageGenerationService {
  /**
   * Generate an image using OpenAI DALL-E 3.
   * Falls back to an SVG placeholder on any failure — never throws.
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY || ''

    if (!apiKey || apiKey.startsWith('sk-or-')) {
      console.warn('[ImageGen] No DALL-E key configured — using placeholder')
      return this.placeholder(request.prompt)
    }

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

      const imageUrl = response.data[0]?.url
      if (!imageUrl) throw new Error('No image URL returned from DALL-E')

      return {
        url:           imageUrl,
        provider:      'openai-dalle-3',
        revisedPrompt: response.data[0]?.revised_prompt,
        metadata: {
          model:          'dall-e-3',
          size:           request.size || '1024x1024',
          quality:        request.quality || 'standard',
          style:          request.style || 'natural',
          originalPrompt: request.prompt,
          enhancedPrompt,
        },
      }
    } catch (error) {
      console.error('[ImageGen] DALL-E failed, using placeholder:', error instanceof Error ? error.message : error)
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