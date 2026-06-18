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
   * Generate an image using OpenAI DALL-E 3
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const { OpenAI } = await import('openai')
      
      const apiKey = process.env.OPENAI_API_KEY
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const openai = new OpenAI({ apiKey })

      // Enhance prompt for educational content
      const enhancedPrompt = this.enhancePromptForEducation(request.prompt, request.style)

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'natural',
      })

      if (!response.data) {
        throw new Error('No image data returned from OpenAI')
      }

      const imageUrl = response.data[0]?.url
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }

      return {
        url: imageUrl,
        provider: 'openai-dalle-3',
        revisedPrompt: response.data[0]?.revised_prompt,
        metadata: {
          model: 'dall-e-3',
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
          style: request.style || 'natural',
          originalPrompt: request.prompt,
          enhancedPrompt
        }
      }
    } catch (error) {
      console.error('OpenAI DALL-E image generation error:', error)
      throw error
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
    const request: ImageGenerationRequest = {
      prompt,
      ...options
    }

    return await this.generateImage(request)
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