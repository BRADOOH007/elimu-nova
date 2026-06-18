// Enhanced Presentation Generator with AI Images - Redesigned Architecture
import PptxGenJS from 'pptxgenjs'
import { imageGenerationService } from './image-generation'

export interface PresentationSlide {
  id: string
  title: string
  content: string[]
  notes?: string
  imagePrompt?: string
  layout: 'title' | 'content' | 'image' | 'split' | 'comparison' | 'timeline'
  order: number
  metadata?: {
    duration?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    interactiveElements?: string[]
  }
}

export interface PresentationRequest {
  title: string
  subtitle?: string
  author?: string
  subject: string
  grade: string
  topic: string
  duration: number
  slides: PresentationSlide[]
  theme: 'education' | 'modern' | 'professional' | 'colorful' | 'minimal'
  generateImages: boolean
  imageStyle: 'educational' | 'diagram' | 'natural' | 'vivid' | 'cartoon'
  options?: {
    includeAnimation?: boolean
    includeTransitions?: boolean
    fontFamily?: string
    primaryColor?: string
    accentColor?: string
  }
}

export class PresentationGenerator {
  private pptx: PptxGenJS
  private theme: any
  private generationProgress: (progress: number, message: string) => void

  constructor(progressCallback?: (progress: number, message: string) => void) {
    this.pptx = new PptxGenJS()
    this.generationProgress = progressCallback || (() => {})
  }

  /**
   * Generate a complete presentation with AI-generated images
   */
  async generatePresentation(request: PresentationRequest): Promise<Buffer> {
    try {
      this.generationProgress(0, 'Initializing presentation...')
      
      // Set presentation properties
      this.pptx.author = request.author || 'ElimuNova AI'
      this.pptx.title = request.title
      this.pptx.subject = `${request.subject} - ${request.grade}`
      this.pptx.company = 'ElimuNova AI'
      this.pptx.revision = '1'

      this.generationProgress(10, 'Applying theme...')
      
      // Apply theme with enhanced styling
      this.applyAdvancedTheme(request.theme, request.options)

      this.generationProgress(20, 'Creating title slide...')
      
      // Add enhanced title slide
      this.addEnhancedTitleSlide(request)

      // Generate images if requested
      let generatedImages: Map<string, string> = new Map()
      
      if (request.generateImages) {
        console.log('🖼️ Image generation enabled, generating images for slides...')
        this.generationProgress(30, 'Generating AI images...')
        generatedImages = await this.generateSlideImages(request.slides, request.imageStyle)
        console.log(`✅ Generated ${generatedImages.size} images for presentation`)
      } else {
        console.log('⚠️ Image generation disabled')
      }

      this.generationProgress(70, 'Creating content slides...')
      
      // Add content slides with enhanced layouts
      for (let i = 0; i < request.slides.length; i++) {
        const slide = request.slides[i]
        const imageUrl = generatedImages.get(slide.id)

        await this.addEnhancedContentSlide(slide, imageUrl, i + 1, request.slides.length)
        
        // Update progress
        const slideProgress = 70 + (i / request.slides.length) * 20
        this.generationProgress(slideProgress, `Creating slide ${i + 1}/${request.slides.length}...`)
      }

      this.generationProgress(95, 'Finalizing presentation...')
      
      // Add summary slide if more than 3 slides
      if (request.slides.length > 3) {
        this.addSummarySlide(request)
      }

      this.generationProgress(100, 'Presentation complete!')
      
      // Generate and return buffer
      const buffer = await this.pptx.write({ outputType: 'nodebuffer' }) as Buffer
      return buffer
      
    } catch (error) {
      console.error('Presentation generation error:', error)
      throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate images for slides that need them with enhanced error handling
   */
  private async generateSlideImages(slides: PresentationSlide[], style: string): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>()
    const totalSlides = slides.filter(s => s.imagePrompt || s.layout === 'image' || s.layout === 'split').length
    let processedSlides = 0

    for (const slide of slides) {
      if (slide.imagePrompt || slide.layout === 'image' || slide.layout === 'split') {
        try {
          const prompt = this.enhanceImagePrompt(slide.imagePrompt || `Educational illustration for: ${slide.title}`, style, slide.layout)
          
          console.log(`Generating image for slide "${slide.title}": ${prompt.substring(0, 100)}...`)
          
          const result = await imageGenerationService.generateImage({
            prompt,
            style: style === 'vivid' ? 'vivid' : 'natural',
            size: '1024x1024'
          })

          if (result && result.url) {
            imageMap.set(slide.id, result.url)
            console.log(`✅ Image generated for slide "${slide.title}"`)
          } else {
            console.log(`⚠️ No image URL returned for slide "${slide.title}"`)
          }
          
          processedSlides++
          const imageProgress = 30 + (processedSlides / totalSlides) * 40
          this.generationProgress(imageProgress, `Generated image ${processedSlides}/${totalSlides}`)
          
        } catch (error) {
          console.error(`Failed to generate image for slide "${slide.title}":`, error)
          // Continue without image - don't break the entire process
        }
        
        // Rate limiting - wait between requests
        if (processedSlides < totalSlides) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    return imageMap
  }

  /**
   * Enhance image prompts based on layout and style
   */
  private enhanceImagePrompt(basePrompt: string, style: string, layout: string): string {
    const styleEnhancements = {
      educational: 'educational illustration, clear and simple, suitable for students, clean design, bright colors',
      diagram: 'technical diagram, labeled, clear lines, educational schematic, infographic style, professional',
      natural: 'realistic, natural lighting, photographic quality, detailed',
      vivid: 'vibrant colors, engaging, eye-catching, dynamic, high contrast',
      cartoon: 'cartoon style, friendly characters, colorful, child-friendly, animated look'
    }

    const layoutEnhancements = {
      title: 'title slide design, welcoming, overview illustration',
      content: 'supporting illustration, complementary to text content',
      image: 'main focus illustration, detailed, comprehensive visual',
      split: 'side illustration, balanced composition, clear visual hierarchy',
      comparison: 'comparison diagram, side-by-side elements, clear distinctions',
      timeline: 'timeline illustration, sequential elements, chronological flow'
    }

    const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.educational
    const layoutHint = layoutEnhancements[layout as keyof typeof layoutEnhancements] || ''

    return `${basePrompt}, ${enhancement}, ${layoutHint}, high quality, professional, 1024x1024 resolution`
  }

  /**
   * Apply advanced theme with comprehensive styling
   */
  private applyAdvancedTheme(themeName: string, options?: PresentationRequest['options']) {
    // Helper function to ensure color is a valid string
    const validateColor = (color: any): string => {
      if (typeof color === 'string' && color.length > 0) {
        return color.replace(/^#/, '') // Remove # if present
      }
      return '000000' // Default to black if invalid
    }

    const themes = {
      education: {
        background: { color: 'FFFFFF' },
        titleColor: validateColor(options?.primaryColor) || '2E5090',
        textColor: '333333',
        accentColor: validateColor(options?.accentColor) || '4472C4',
        secondaryColor: 'E8F0FE',
        fontFamily: options?.fontFamily || 'Calibri',
        headerFont: 'Calibri Bold',
        gradients: {
          primary: ['2E5090', '4472C4'],
          secondary: ['E8F0FE', 'FFFFFF']
        }
      },
      modern: {
        background: { color: 'F8F9FA' },
        titleColor: validateColor(options?.primaryColor) || '1A1A1A',
        textColor: '2D3748',
        accentColor: validateColor(options?.accentColor) || '00BCD4',
        secondaryColor: 'E2E8F0',
        fontFamily: options?.fontFamily || 'Segoe UI',
        headerFont: 'Segoe UI Semibold',
        gradients: {
          primary: ['1A1A1A', '4A5568'],
          secondary: ['E2E8F0', 'F8F9FA']
        }
      },
      professional: {
        background: { color: 'FFFFFF' },
        titleColor: validateColor(options?.primaryColor) || '1A237E',
        textColor: '212121',
        accentColor: validateColor(options?.accentColor) || '3F51B5',
        secondaryColor: 'F3F4F6',
        fontFamily: options?.fontFamily || 'Arial',
        headerFont: 'Arial Bold',
        gradients: {
          primary: ['1A237E', '3F51B5'],
          secondary: ['F3F4F6', 'FFFFFF']
        }
      },
      colorful: {
        background: { color: 'FFFFFF' },
        titleColor: validateColor(options?.primaryColor) || 'E91E63',
        textColor: '37474F',
        accentColor: validateColor(options?.accentColor) || 'FF9800',
        secondaryColor: 'FFF3E0',
        fontFamily: options?.fontFamily || 'Comic Sans MS',
        headerFont: 'Comic Sans MS Bold',
        gradients: {
          primary: ['E91E63', 'FF9800'],
          secondary: ['FFF3E0', 'FFFFFF']
        }
      },
      minimal: {
        background: { color: 'FAFAFA' },
        titleColor: validateColor(options?.primaryColor) || '263238',
        textColor: '455A64',
        accentColor: validateColor(options?.accentColor) || '607D8B',
        secondaryColor: 'ECEFF1',
        fontFamily: options?.fontFamily || 'Helvetica',
        headerFont: 'Helvetica Bold',
        gradients: {
          primary: ['263238', '455A64'],
          secondary: ['ECEFF1', 'FAFAFA']
        }
      }
    }

    this.theme = themes[themeName as keyof typeof themes] || themes.education
    
    // Define custom layout with proper dimensions
    this.pptx.defineLayout({ 
      name: 'CUSTOM', 
      width: 10, 
      height: 5.625 
    })
    this.pptx.layout = 'CUSTOM'

    // Set default font
    this.pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: this.theme.background,
      objects: [
        {
          text: {
            text: 'ElimuNova AI',
            options: {
              x: 8.5, y: 5.2, w: 1.4, h: 0.3,
              fontSize: 8, color: this.theme.accentColor,
              fontFace: this.theme.fontFamily, align: 'right'
            }
          }
        }
      ]
    })
  }

  /**
   * Add enhanced title slide with gradient background and better typography
   */
  private addEnhancedTitleSlide(request: PresentationRequest) {
    const slide = this.pptx.addSlide()

    // Gradient background
    (slide as any).background = {
      fill: {
        type: 'gradient',
        angle: 45,
        colors: [
          { color: this.theme.gradients.primary[0], position: 0 },
          { color: this.theme.gradients.primary[1], position: 100 }
        ]
      }
    }

    // Main title with shadow effect
    slide.addText(request.title, {
      x: 0.5, y: 1.2, w: 9, h: 1.8,
      fontSize: 48, bold: true, color: 'FFFFFF',
      fontFace: this.theme.headerFont,
      align: 'center', valign: 'middle',
      shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '000000', opacity: 0.3 }
    })

    // Subtitle with subject and grade
    const subtitle = `${request.subject} • ${request.grade} • ${request.duration} minutes`
    slide.addText(subtitle, {
      x: 0.5, y: 3.2, w: 9, h: 0.6,
      fontSize: 20, color: 'E8F0FE',
      fontFace: this.theme.fontFamily,
      align: 'center', valign: 'middle'
    })

    // Topic highlight
    slide.addText(request.topic, {
      x: 1.5, y: 4, w: 7, h: 0.8,
      fontSize: 24, bold: true, color: 'FFFFFF',
      fontFace: this.theme.fontFamily,
      align: 'center', valign: 'middle',
      fill: { color: this.theme.accentColor, transparency: 20 },
      line: { color: 'FFFFFF', width: 2 },
      rectRadius: 0.2
    })

    // Decorative elements
    slide.addShape('rect', {
      x: 0.2, y: 0.2, w: 0.1, h: 5.225,
      fill: { color: this.theme.accentColor, transparency: 30 }
    })
    
    slide.addShape('rect', {
      x: 9.7, y: 0.2, w: 0.1, h: 5.225,
      fill: { color: this.theme.accentColor, transparency: 30 }
    })

    // Footer with branding
    slide.addText('Generated by ElimuNova AI • Powered by Artificial Intelligence', {
      x: 0.5, y: 5.1, w: 9, h: 0.4,
      fontSize: 10, color: 'CCCCCC',
      fontFace: this.theme.fontFamily,
      align: 'center', italic: true
    })
  }

  /**
   * Add enhanced content slide with advanced layouts and styling
   */
  private async addEnhancedContentSlide(slideData: PresentationSlide, imageUrl?: string, slideNumber?: number, totalSlides?: number) {
    const slide = this.pptx.addSlide()

    // Enhanced background with subtle gradient
    (slide as any).background = {
      fill: {
        type: 'gradient',
        angle: 180,
        colors: [
          { color: this.theme.background.color, position: 0 },
          { color: this.theme.secondaryColor, position: 100 }
        ]
      }
    }

    // Header section with decorative line
    slide.addShape('rect', {
      x: 0.5, y: 0.8, w: 9, h: 0.05,
      fill: { color: this.theme.accentColor }
    })

    const layout = slideData.layout || 'content'

    // Enhanced title with better typography
    slide.addText(slideData.title, {
      x: 0.5, y: 0.2, w: 9, h: 0.7,
      fontSize: 36, bold: true, color: this.theme.titleColor,
      fontFace: this.theme.headerFont,
      align: 'left', valign: 'middle'
    })

    // Layout-specific content rendering
    switch (layout) {
      case 'image':
        await this.renderImageLayout(slide, slideData, imageUrl)
        break
      case 'split':
        await this.renderSplitLayout(slide, slideData, imageUrl)
        break
      case 'comparison':
        await this.renderComparisonLayout(slide, slideData, imageUrl)
        break
      case 'timeline':
        await this.renderTimelineLayout(slide, slideData, imageUrl)
        break
      default:
        await this.renderContentLayout(slide, slideData, imageUrl)
    }

    // Add speaker notes with enhanced formatting
    if (slideData.notes) {
      const enhancedNotes = `Slide ${slideNumber}: ${slideData.title}\n\n${slideData.notes}\n\nDuration: ${slideData.metadata?.duration || 3} minutes\nDifficulty: ${slideData.metadata?.difficulty || 'medium'}`
      slide.addNotes(enhancedNotes)
    }

    // Enhanced footer with progress indicator
    this.addSlideFooter(slide, slideNumber, totalSlides)
  }

  /**
   * Render image-focused layout
   */
  private async renderImageLayout(slide: any, slideData: PresentationSlide, imageUrl?: string) {
    if (imageUrl) {
      // Large centered image
      slide.addImage({
        data: imageUrl,
        x: 1, y: 1.2, w: 8, h: 3.5,
        rounding: true
      })

      // Content below image
      if (slideData.content.length > 0) {
        const bulletPoints = slideData.content.map(item => ({ 
          text: item, 
          options: { 
            bullet: { type: 'number' },
            fontSize: 14,
            color: this.theme.textColor
          } 
        }))
        
        slide.addText(bulletPoints, {
          x: 1, y: 4.8, w: 8, h: 0.7,
          fontSize: 14, color: this.theme.textColor,
          fontFace: this.theme.fontFamily,
          align: 'center'
        })
      }
    } else {
      // Fallback to content layout if no image
      await this.renderContentLayout(slide, slideData)
    }
  }

  /**
   * Render split layout (content + image)
   */
  private async renderSplitLayout(slide: any, slideData: PresentationSlide, imageUrl?: string) {
    // Content on left side
    const bulletPoints = slideData.content.map(item => ({ 
      text: item, 
      options: { 
        bullet: true,
        fontSize: 16,
        color: this.theme.textColor
      } 
    }))
    
    slide.addText(bulletPoints, {
      x: 0.5, y: 1.2, w: imageUrl ? 4.8 : 9, h: 3.8,
      fontSize: 16, color: this.theme.textColor,
      fontFace: this.theme.fontFamily,
      lineSpacing: 24
    })

    // Image on right side
    if (imageUrl) {
      slide.addShape('rect', {
        x: 5.4, y: 1.1, w: 4.1, h: 4,
        fill: { color: this.theme.secondaryColor },
        line: { color: this.theme.accentColor, width: 2 },
        rectRadius: 0.1
      })

      slide.addImage({
        data: imageUrl,
        x: 5.5, y: 1.2, w: 3.9, h: 3.8,
        rounding: true
      })
    }
  }

  /**
   * Render comparison layout
   */
  private async renderComparisonLayout(slide: any, slideData: PresentationSlide, imageUrl?: string) {
    const midPoint = slideData.content.length / 2
    const leftContent = slideData.content.slice(0, Math.ceil(midPoint))
    const rightContent = slideData.content.slice(Math.ceil(midPoint))

    // Left column
    slide.addShape('rect', {
      x: 0.5, y: 1.1, w: 4.2, h: 4,
      fill: { color: this.theme.secondaryColor, transparency: 50 },
      line: { color: this.theme.accentColor, width: 1 },
      rectRadius: 0.1
    })

    const leftBullets = leftContent.map(item => ({ text: item, options: { bullet: true } }))
    slide.addText(leftBullets, {
      x: 0.7, y: 1.3, w: 3.8, h: 3.6,
      fontSize: 14, color: this.theme.textColor,
      fontFace: this.theme.fontFamily
    })

    // Right column
    slide.addShape('rect', {
      x: 5.3, y: 1.1, w: 4.2, h: 4,
      fill: { color: this.theme.accentColor, transparency: 80 },
      line: { color: this.theme.accentColor, width: 1 },
      rectRadius: 0.1
    })

    const rightBullets = rightContent.map(item => ({ text: item, options: { bullet: true } }))
    slide.addText(rightBullets, {
      x: 5.5, y: 1.3, w: 3.8, h: 3.6,
      fontSize: 14, color: this.theme.textColor,
      fontFace: this.theme.fontFamily
    })
  }

  /**
   * Render timeline layout
   */
  private async renderTimelineLayout(slide: any, slideData: PresentationSlide, imageUrl?: string) {
    const stepHeight = 3.5 / slideData.content.length
    
    slideData.content.forEach((item, index) => {
      const y = 1.3 + (index * stepHeight)
      
      // Timeline dot
      slide.addShape('circle', {
        x: 1, y: y + 0.1, w: 0.2, h: 0.2,
        fill: { color: this.theme.accentColor }
      })

      // Timeline line (except for last item)
      if (index < slideData.content.length - 1) {
        slide.addShape('line', {
          x: 1.1, y: y + 0.3, w: 0, h: stepHeight - 0.2,
          line: { color: this.theme.accentColor, width: 2 }
        })
      }

      // Content text
      slide.addText(item, {
        x: 1.5, y: y, w: 7.5, h: stepHeight - 0.1,
        fontSize: 14, color: this.theme.textColor,
        fontFace: this.theme.fontFamily,
        valign: 'top'
      })
    })
  }

  /**
   * Render standard content layout
   */
  private async renderContentLayout(slide: any, slideData: PresentationSlide, imageUrl?: string) {
    // Main content area
    const bulletPoints = slideData.content.map(item => ({ 
      text: item, 
      options: { 
        bullet: true,
        fontSize: 18,
        color: this.theme.textColor
      } 
    }))
    
    slide.addText(bulletPoints, {
      x: 0.5, y: 1.2, w: imageUrl ? 6 : 9, h: 3.8,
      fontSize: 18, color: this.theme.textColor,
      fontFace: this.theme.fontFamily,
      lineSpacing: 28
    })

    // Optional side image
    if (imageUrl) {
      slide.addShape('rect', {
        x: 6.8, y: 1.5, w: 2.7, h: 3.2,
        fill: { color: this.theme.secondaryColor },
        line: { color: this.theme.accentColor, width: 1 },
        rectRadius: 0.1
      })

      slide.addImage({
        data: imageUrl,
        x: 6.9, y: 1.6, w: 2.5, h: 3,
        rounding: true
      })
    }
  }

  /**
   * Add enhanced footer with progress and branding
   */
  private addSlideFooter(slide: any, slideNumber?: number, totalSlides?: number) {
    // Progress bar
    if (slideNumber && totalSlides) {
      const progressWidth = (slideNumber / totalSlides) * 9
      
      // Background bar
      slide.addShape('rect', {
        x: 0.5, y: 5.4, w: 9, h: 0.05,
        fill: { color: this.theme.secondaryColor }
      })
      
      // Progress bar
      slide.addShape('rect', {
        x: 0.5, y: 5.4, w: progressWidth, h: 0.05,
        fill: { color: this.theme.accentColor }
      })
    }

    // Slide number
    if (slideNumber) {
      slide.addText(`${slideNumber}`, {
        x: 9.2, y: 5.1, w: 0.5, h: 0.3,
        fontSize: 12, color: this.theme.accentColor,
        fontFace: this.theme.fontFamily,
        align: 'right', bold: true
      })
    }
  }

  /**
   * Add summary slide
   */
  private addSummarySlide(request: PresentationRequest) {
    const slide = this.pptx.addSlide()

    // Background similar to title slide
    (slide as any).background = {
      fill: {
        type: 'gradient',
        angle: 225,
        colors: [
          { color: this.theme.gradients.primary[1], position: 0 },
          { color: this.theme.gradients.primary[0], position: 100 }
        ]
      }
    }

    // Summary title
    slide.addText('Summary & Key Takeaways', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 40, bold: true, color: 'FFFFFF',
      fontFace: this.theme.headerFont,
      align: 'center', valign: 'middle'
    })

    // Key points from all slides
    const keyPoints = request.slides
      .filter(s => s.content.length > 0)
      .map(s => s.content[0])
      .slice(0, 5)

    const summaryPoints = keyPoints.map(point => ({ 
      text: point, 
      options: { 
        bullet: true,
        fontSize: 18,
        color: 'FFFFFF'
      } 
    }))

    slide.addText(summaryPoints, {
      x: 1, y: 1.8, w: 8, h: 2.8,
      fontSize: 18, color: 'FFFFFF',
      fontFace: this.theme.fontFamily,
      lineSpacing: 32
    })

    // Thank you message
    slide.addText('Thank you for your attention!', {
      x: 0.5, y: 4.8, w: 9, h: 0.6,
      fontSize: 24, bold: true, color: 'E8F0FE',
      fontFace: this.theme.fontFamily,
      align: 'center', italic: true
    })
  }

  /**
   * Generate presentation from AI content with enhanced options
   */
  static async generateFromAIContent(
    title: string,
    content: string,
    options?: {
      generateImages?: boolean
      imageStyle?: string
      theme?: string
      subject?: string
      grade?: string
      duration?: number
    }
  ): Promise<Buffer> {
    const generator = new PresentationGenerator((progress, message) => {
      console.log(`AI Content Generation Progress: ${progress}% - ${message}`)
    })

    // Parse content into enhanced slides
    const slides = this.parseContentIntoSlides(content)

    return await generator.generatePresentation({
      title,
      subtitle: 'Generated by ElimuNova AI',
      author: 'ElimuNova AI',
      subject: options?.subject || 'Education',
      grade: options?.grade || 'General',
      topic: title,
      duration: options?.duration || 45,
      slides,
      theme: (options?.theme as any) || 'education',
      generateImages: options?.generateImages !== false,
      imageStyle: (options?.imageStyle as any) || 'educational',
      options: {
        includeAnimation: false,
        includeTransitions: true,
        fontFamily: 'Calibri'
      }
    })
  }

  /**
   * Parse AI-generated content into enhanced slides with image prompts
   */
  private static parseContentIntoSlides(content: string): PresentationSlide[] {
    const slides: PresentationSlide[] = []
    
    // Split by slide markers
    const sections = content.split(/(?=^#\s*Slide\s*\d+)/m)

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]
      if (!section.trim()) continue

      const lines = section.trim().split('\n')
      
      // Extract title (first line after # Slide X:)
      const titleLine = lines[0]
      const titleMatch = titleLine.match(/^#\s*Slide\s*\d+:\s*(.+)$/)
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled Slide'
      
      // Extract different sections
      let slideContent: string[] = []
      let notes = ''
      let imagePrompt = ''
      let layout: PresentationSlide['layout'] = 'content'
      
      let currentSection = ''
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith('**Content:**')) {
          currentSection = 'content'
          continue
        } else if (line.startsWith('**Speaker Notes:**')) {
          currentSection = 'notes'
          continue
        } else if (line.startsWith('**Image Prompt:**')) {
          currentSection = 'imagePrompt'
          continue
        } else if (line.startsWith('**Layout:**')) {
          currentSection = 'layout'
          continue
        } else if (line === '---' || line === '') {
          continue
        }
        
        // Process content based on current section
        if (currentSection === 'content' && line) {
          // Clean up bullet points and add to content
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim()
          if (cleanLine) {
            slideContent.push(cleanLine)
          }
        } else if (currentSection === 'notes' && line) {
          notes += (notes ? ' ' : '') + line
        } else if (currentSection === 'imagePrompt' && line) {
          imagePrompt += (imagePrompt ? ' ' : '') + line
        } else if (currentSection === 'layout' && line) {
          const layoutValue = line.toLowerCase().trim()
          if (['title', 'content', 'image', 'split', 'comparison', 'timeline'].includes(layoutValue)) {
            layout = layoutValue as PresentationSlide['layout']
          }
        }
      }

      // Determine layout automatically if not specified
      if (!layout || layout === 'content') {
        if (sectionIndex === 0) {
          layout = 'title'
        } else if (imagePrompt && slideContent.length <= 2) {
          layout = 'image'
        } else if (imagePrompt && slideContent.length > 2) {
          layout = 'split'
        } else if (slideContent.length > 6) {
          layout = 'comparison'
        } else {
          layout = 'content'
        }
      }

      // Create slide if we have content
      if (title && slideContent.length > 0) {
        slides.push({
          id: `slide-${sectionIndex}`,
          title,
          content: slideContent,
          notes: notes || `Teaching notes for ${title}. Engage students with questions and examples.`,
          imagePrompt: imagePrompt || `Educational illustration for: ${title}, suitable for students, colorful, engaging`,
          layout,
          order: sectionIndex + 1,
          metadata: {
            duration: 3,
            difficulty: slideContent.length > 4 ? 'medium' : 'easy',
            interactiveElements: slideContent.filter(c => c.includes('?') || c.includes('discuss') || c.includes('ask'))
          }
        })
      }
    }

    // If no slides were parsed, try fallback parsing
    if (slides.length === 0) {
      return this.fallbackParseContent(content)
    }

    return slides
  }

  /**
   * Fallback content parsing for simpler formats
   */
  private static fallbackParseContent(content: string): PresentationSlide[] {
    const slides: PresentationSlide[] = []
    
    // Split by headers (## or ###)
    const sections = content.split(/(?=^#{1,3}\s)/m)

    for (let index = 0; index < sections.length; index++) {
      const section = sections[index]
      if (!section.trim()) continue

      const lines = section.trim().split('\n')
      const titleLine = lines[0]
      
      // Extract title
      const title = titleLine.replace(/^#{1,3}\s*/, '').trim()
      
      // Extract content (bullet points or paragraphs)
      const contentLines = lines.slice(1)
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 0 && !line.startsWith('**'))

      if (title && contentLines.length > 0) {
        slides.push({
          id: `fallback-slide-${index}`,
          title,
          content: contentLines,
          layout: index === 0 ? 'title' : 'content',
          imagePrompt: `Educational illustration for: ${title}, colorful, engaging, suitable for students`,
          order: index + 1,
          notes: `Teaching guidance for ${title}. Use examples and encourage student participation.`,
          metadata: {
            duration: 3,
            difficulty: 'medium'
          }
        })
      }
    }

    // If still no slides, create a basic slide from the content
    if (slides.length === 0 && content.trim()) {
      slides.push({
        id: 'basic-slide-1',
        title: 'Presentation Content',
        content: content.split('\n').filter(line => line.trim()).slice(0, 5),
        layout: 'content',
        imagePrompt: 'Educational illustration, colorful, engaging',
        order: 1,
        notes: 'Present this content to students with enthusiasm.',
        metadata: {
          duration: 5,
          difficulty: 'medium'
        }
      })
    }

    return slides
  }
}

export const presentationGenerator = new PresentationGenerator()
