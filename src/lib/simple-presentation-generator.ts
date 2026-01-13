// Simple Presentation Generator - Focused on Working Functionality
import PptxGenJS from 'pptxgenjs'
import { OpenAIService } from './openai-service'
import { prisma } from './prisma'

export interface SimplePresentationSlide {
  id: string
  title: string
  content: string[]
  imagePrompt?: string
  layout: 'title' | 'content' | 'image' | 'split'
}

export interface SimplePresentationRequest {
  title: string
  author?: string
  slides: SimplePresentationSlide[]
  generateImages: boolean
  imageStyle: 'natural' | 'vivid'
  userId?: string
  teacherId?: string
}

export class SimplePresentationGenerator {
  private pptx: PptxGenJS

  constructor() {
    this.pptx = new PptxGenJS()
    
    // Set basic presentation properties
    this.pptx.author = 'ElimuNova AI'
    this.pptx.company = 'ElimuNova AI'
    this.pptx.title = 'AI Generated Presentation'
  }

  /**
   * Generate a simple presentation with embedded images
   */
  async generatePresentation(request: SimplePresentationRequest): Promise<Buffer> {
    try {
      console.log('🎯 Starting presentation generation with images...')
      
      // Generate and save images if requested
      let imageMap = new Map<string, string>()
      
      if (request.generateImages) {
        console.log('🖼️ Generating and saving images for slides...')
        imageMap = await this.generateAndSaveImages(request.slides, request.imageStyle, request.userId, request.teacherId)
        console.log(`✅ Generated and saved ${imageMap.size} images`)
      }

      // Add title slide
      this.addTitleSlide(request.title, request.author)

      // Add content slides with embedded images
      for (const slide of request.slides) {
        const imageData = imageMap.get(slide.id)
        console.log(`📄 Adding slide "${slide.title}" with image: ${!!imageData}`)
        await this.addContentSlideWithImage(slide, imageData)
      }

      console.log('📄 Generating PowerPoint buffer...')
      const buffer = await this.pptx.write({ outputType: 'nodebuffer' }) as Buffer
      console.log('✅ Presentation with embedded images generated successfully!')
      
      return buffer
      
    } catch (error) {
      console.error('❌ Presentation generation error:', error)
      throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate images using OpenAI and save to database
   */
  private async generateAndSaveImages(slides: SimplePresentationSlide[], style: 'natural' | 'vivid', userId?: string, teacherId?: string): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>()
    
    console.log(`🎨 Starting image generation for ${slides.length} slides`)
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY)

    for (const slide of slides) {
      console.log(`🔍 Checking slide "${slide.title}": layout=${slide.layout}, hasPrompt=${!!slide.imagePrompt}`)
      
      if (slide.imagePrompt && (slide.layout === 'image' || slide.layout === 'split')) {
        try {
          console.log(`🎨 Generating image for "${slide.title}"...`)
          console.log(`📝 Prompt: ${slide.imagePrompt}`)
          
          // Generate image using OpenAI
          const result = await OpenAIService.generateImage({
            prompt: slide.imagePrompt,
            style: style,
            size: '1024x1024'
          })

          if (result && result.url) {
            console.log(`✅ Image generated for "${slide.title}": ${result.url}`)
            
            // Convert URL to base64 data URI for PptxGenJS
            console.log(`🔄 Converting image to data URI...`)
            const imageData = await this.convertImageToDataUri(result.url)
            console.log(`✅ Converted to data URI (length: ${imageData.length})`)
            
            imageMap.set(slide.id, imageData)
            
            // Save to database for gallery
            if (userId || teacherId) {
              await this.saveImageToDatabase(result.url, slide.title, slide.imagePrompt, userId, teacherId)
            }
          } else {
            console.log(`❌ No image URL returned for "${slide.title}"`)
            console.log('Result:', result)
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`❌ Failed to generate image for "${slide.title}":`, error)
          // Continue without image
        }
      } else {
        console.log(`⏭️ Skipping image for "${slide.title}" (layout: ${slide.layout}, prompt: ${!!slide.imagePrompt})`)
      }
    }

    console.log(`🎨 Image generation complete. Generated ${imageMap.size} out of ${slides.length} images`)
    return imageMap
  }

  /**
   * Convert image URL to base64 data URI for PptxGenJS
   */
  private async convertImageToDataUri(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.error('❌ Failed to convert image to data URI:', error)
      throw error
    }
  }

  /**
   * Save image to database for gallery
   */
  private async saveImageToDatabase(imageUrl: string, title: string, prompt: string, userId?: string, teacherId?: string) {
    try {
      await prisma.aIGeneratedImage.create({
        data: {
          filename: `presentation_${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_')}.png`,
          originalUrl: imageUrl,
          storedUrl: imageUrl, // For now, same as original
          topic: title,
          prompt: prompt,
          type: 'ILLUSTRATION',
          size: 'MEDIUM_1024',
          quality: 'standard',
          userId: userId || '',
          teacherId: teacherId || null,
          metadata: JSON.stringify({
            source: 'presentation_generator',
            slideTitle: title
          })
        }
      })
      console.log(`💾 Saved image to database: ${title}`)
    } catch (error) {
      console.error('❌ Failed to save image to database:', error)
      // Don't throw - continue with presentation generation
    }
  }

  /**
   * Add title slide
   */
  private addTitleSlide(title: string, author?: string) {
    const slide = this.pptx.addSlide()
    
    // Background
    slide.background = { color: 'F8F9FA' }

    // Title
    slide.addText(title, {
      x: 0.5, y: 2, w: 9, h: 1.5,
      fontSize: 36, bold: true, color: '2E5090',
      fontFace: 'Calibri',
      align: 'center', valign: 'middle'
    })

    // Author
    if (author) {
      slide.addText(`By: ${author}`, {
        x: 0.5, y: 3.8, w: 9, h: 0.5,
        fontSize: 18, color: '666666',
        fontFace: 'Calibri',
        align: 'center'
      })
    }

    // Footer
    slide.addText('Generated by ElimuNova AI', {
      x: 8, y: 5, w: 1.5, h: 0.3,
      fontSize: 10, color: '999999',
      fontFace: 'Calibri',
      align: 'right'
    })
  }

  /**
   * Add content slide with embedded image
   */
  private async addContentSlideWithImage(slideData: SimplePresentationSlide, imageData?: string) {
    const slide = this.pptx.addSlide()
    
    // Background
    slide.background = { color: 'FFFFFF' }

    // Title
    slide.addText(slideData.title, {
      x: 0.5, y: 0.3, w: 9, h: 0.8,
      fontSize: 28, bold: true, color: '2E5090',
      fontFace: 'Calibri Bold'
    })

    // Content and image based on layout
    if (slideData.layout === 'image' && imageData) {
      // Image-focused layout
      await this.addImageLayout(slide, slideData, imageData)
    } else if (slideData.layout === 'split' && imageData) {
      // Split layout (content + image)
      await this.addSplitLayout(slide, slideData, imageData)
    } else {
      // Content-only layout
      this.addContentLayout(slide, slideData)
    }
  }

  /**
   * Add image-focused layout with embedded image
   */
  private async addImageLayout(slide: any, slideData: SimplePresentationSlide, imageData: string) {
    try {
      // Large embedded image
      slide.addImage({
        data: imageData, // Use data URI format
        x: 1, y: 1.5, w: 8, h: 3.5
      })
      console.log(`🖼️ Embedded image in slide: ${slideData.title}`)
    } catch (error) {
      console.error(`❌ Failed to embed image in slide "${slideData.title}":`, error)
    }

    // Brief content below
    if (slideData.content.length > 0) {
      const bulletPoints = slideData.content.map(item => ({ text: item, options: { bullet: true } }))
      
      slide.addText(bulletPoints, {
        x: 1, y: 5.2, w: 8, h: 0.8,
        fontSize: 14, color: '333333',
        fontFace: 'Calibri'
      })
    }
  }

  /**
   * Add split layout (content + embedded image)
   */
  private async addSplitLayout(slide: any, slideData: SimplePresentationSlide, imageData: string) {
    // Content on left
    const bulletPoints = slideData.content.map(item => ({ text: item, options: { bullet: true } }))
    
    slide.addText(bulletPoints, {
      x: 0.5, y: 1.3, w: 4.5, h: 3.5,
      fontSize: 16, color: '333333',
      fontFace: 'Calibri'
    })

    try {
      // Embedded image on right
      slide.addImage({
        data: imageData, // Use data URI format
        x: 5.2, y: 1.3, w: 4.3, h: 3.5
      })
      console.log(`🖼️ Embedded image in split layout: ${slideData.title}`)
    } catch (error) {
      console.error(`❌ Failed to embed image in split layout "${slideData.title}":`, error)
    }
  }

  /**
   * Add content-only layout
   */
  private addContentLayout(slide: any, slideData: SimplePresentationSlide) {
    const bulletPoints = slideData.content.map(item => ({ text: item, options: { bullet: true } }))
    
    slide.addText(bulletPoints, {
      x: 0.5, y: 1.3, w: 9, h: 3.5,
      fontSize: 18, color: '333333',
      fontFace: 'Calibri'
    })
  }
}

// Export for use
export const simplePresentationGenerator = new SimplePresentationGenerator()

/**
 * Generate a simple presentation with the provided data
 */
export async function generateSimplePresentation(options: {
  title: string
  slides: any[]
  includeImages?: boolean
  theme?: string
  userId?: string
  teacherId?: string
}): Promise<Buffer> {
  const generator = new SimplePresentationGenerator()
  
  // Convert slides to the expected format
  const formattedSlides: SimplePresentationSlide[] = options.slides.map((slide, index) => ({
    id: slide.id || `slide-${index}`,
    title: slide.title || `Slide ${index + 1}`,
    content: Array.isArray(slide.content) ? slide.content : [slide.content || ''],
    imagePrompt: slide.imagePrompt || slide.imageDescription,
    layout: slide.layout || 'content'
  }))

  const request: SimplePresentationRequest = {
    title: options.title,
    author: 'ElimuNova AI Teacher',
    slides: formattedSlides,
    generateImages: options.includeImages || false,
    imageStyle: 'natural',
    userId: options.userId,
    teacherId: options.teacherId
  }

  return await generator.generatePresentation(request)
}