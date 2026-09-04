/**
 * ElimuNova Presentation Generator
 * Matches TutorBot AI slide style exactly:
 * - Coloured section header bar (introduction=blue, body=green, conclusion=purple)
 * - Section badge + slide counter in header
 * - Numbered bullet points on content column
 * - AI image panel on right (split layout) or full-width (image layout)
 * - Accent underline below title
 * - Branded footer: "ElimuNova AI | Subject • Grade"
 * - Speaker notes embedded
 */
import PptxGenJS from 'pptxgenjs'
import { OpenAIService } from './openai-service'
import { prisma } from './prisma'
import { ImageBank } from './image-bank'

export interface SimplePresentationSlide {
  id:           string
  title:        string
  content:      string[]
  imagePrompt?: string
  imageUrl?:    string
  layout:       'title' | 'content' | 'image' | 'split'
  section?:     'introduction' | 'body' | 'conclusion'
  speakerNotes?: string
}

export interface SimplePresentationRequest {
  title:          string
  author?:        string
  subject?:       string
  grade?:         string
  slides:         SimplePresentationSlide[]
  generateImages: boolean
  imageStyle:     'natural' | 'vivid'
  userId?:        string
  teacherId?:     string
}

// ── Section colour palette (matches TutorBot exactly) ──────────────────────
const SECTION_STYLES = {
  introduction: { bg: '1a3699', accent: '2563eb', contentBg: 'eef2ff', label: 'INTRODUCTION' },
  body:         { bg: '036d4d', accent: '059669', contentBg: 'ecfdf5', label: 'BODY'         },
  conclusion:   { bg: '6d28d9', accent: '8b5cf6', contentBg: 'f5f3ff', label: 'CONCLUSION'  },
}

function getSection(slide: SimplePresentationSlide, index: number, total: number): 'introduction' | 'body' | 'conclusion' {
  if (slide.section) return slide.section
  if (index === 0 || index === 1) return 'introduction'
  if (index >= total - 2)        return 'conclusion'
  return 'body'
}

export class SimplePresentationGenerator {

  async generatePresentation(request: SimplePresentationRequest): Promise<Buffer> {
    const pptx = new PptxGenJS()
    pptx.layout  = 'LAYOUT_16x9'
    pptx.author  = request.author  || 'ElimuNova AI'
    pptx.company = 'ElimuNova AI'
    pptx.title   = request.title

    try {
      console.log('🎯 ElimuNova PPTX — starting generation...')

      // Generate images in parallel (only for slides that need them)
      const imageMap = new Map<string, string>()
      if (request.generateImages) {
        await this.generateImages(request.slides, request.imageStyle, imageMap, request.userId, request.teacherId)
        console.log(`✅ Images ready: ${imageMap.size}/${request.slides.length}`)
      }

      // Use pre-picked images (stock imports, previously generated) when present
      for (const slide of request.slides) {
        if (slide.imageUrl && !imageMap.has(slide.id)) {
          const embeddable = await this.toEmbeddable(slide.imageUrl, slide.id)
          if (embeddable) imageMap.set(slide.id, embeddable)
        }
      }

      const total = request.slides.length

      // Title slide
      this.addTitleSlide(pptx, request.title, request.author, request.subject, request.grade)

      // Content slides
      for (let i = 0; i < total; i++) {
        const slide     = request.slides[i]!
        const section   = getSection(slide, i, total)
        const style     = SECTION_STYLES[section]
        const imageData = imageMap.get(slide.id)
        const slideNum  = i + 1
        this.addContentSlide(pptx, slide, section, style, imageData, slideNum, total, request.subject, request.grade)
      }

      // Closing slide
      this.addClosingSlide(pptx, request.title, request.subject, request.grade)

      const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
      return buffer

    } catch (error) {
      console.error('❌ PPTX generation error:', error)
      throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ── Title Slide ──────────────────────────────────────────────────────────
  private addTitleSlide(pptx: PptxGenJS, title: string, author?: string, subject?: string, grade?: string) {
    const slide = pptx.addSlide()
    // Navy gradient background
    slide.background = { color: '0f172a' }

    // Top accent bar
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.12, fill: { color: '2563eb' } })

    // ElimuNova badge
    slide.addText('ElimuNova AI', {
      x: 0.4, y: 0.25, w: 2.5, h: 0.4,
      fontSize: 13, bold: true, color: '93c5fd',
      fontFace: 'Calibri',
    })

    // Main title
    slide.addText(title, {
      x: 0.8, y: 1.6, w: 8.4, h: 1.8,
      fontSize: 40, bold: true, color: 'FFFFFF',
      fontFace: 'Calibri', align: 'center', valign: 'middle',
      shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, opacity: 0.4 },
    })

    // Accent underline
    slide.addShape('rect', { x: 3.5, y: 3.55, w: 3, h: 0.08, fill: { color: '2563eb' } })

    // Subject + Grade pill
    const meta = [subject, grade].filter(Boolean).join(' • ')
    if (meta) {
      slide.addText(meta, {
        x: 2.5, y: 3.8, w: 5, h: 0.45,
        fontSize: 15, color: '94a3b8', fontFace: 'Calibri', align: 'center',
        fill: { color: '1e293b' },
      })
    }

    // Author
    if (author) {
      slide.addText(`Prepared by: ${author}`, {
        x: 0.5, y: 4.6, w: 9, h: 0.35,
        fontSize: 13, color: '64748b', fontFace: 'Calibri', align: 'center',
      })
    }

    // Footer bar
    slide.addShape('rect', { x: 0, y: 5.2, w: '100%', h: 0.12, fill: { color: '1e3a5f' } })
    slide.addText('Powered by ElimuNova AI', {
      x: 0.4, y: 5.25, w: 9.2, h: 0.25,
      fontSize: 9, color: '94a3b8', fontFace: 'Arial', align: 'center',
    })
  }

  // ── Content Slide ────────────────────────────────────────────────────────
  private addContentSlide(
    pptx: PptxGenJS,
    slide: SimplePresentationSlide,
    section: 'introduction' | 'body' | 'conclusion',
    style: typeof SECTION_STYLES['body'],
    imageData: string | undefined,
    slideNum: number,
    total: number,
    subject?: string,
    grade?: string,
  ) {
    const pptSlide = pptx.addSlide()
    pptSlide.background = { color: 'FFFFFF' }

    const hasImage = !!imageData && (slide.layout === 'split' || slide.layout === 'image')

    // ── Header bar ──────────────────────────────────────────────────────
    pptSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: style.bg } })
    // Thin accent line below header
    pptSlide.addShape('rect', { x: 0, y: 0.7, w: '100%', h: 0.06, fill: { color: style.accent } })

    // Section badge
    pptSlide.addText(style.label, {
      x: 0.3, y: 0.13, w: 1.8, h: 0.42,
      fontSize: 10, bold: true, color: 'FFFFFF',
      fontFace: 'Calibri', align: 'center', valign: 'middle',
      fill: { color: style.accent },
    })

    // Slide counter
    pptSlide.addText(`${slideNum} / ${total}`, {
      x: 8.4, y: 0.18, w: 1.2, h: 0.35,
      fontSize: 12, bold: true, color: 'FFFFFF',
      fontFace: 'Calibri', align: 'right',
    })

    // ── Title ────────────────────────────────────────────────────────────
    const titleW = hasImage ? 5.8 : 9.2
    pptSlide.addText(slide.title, {
      x: 0.4, y: 0.9, w: titleW, h: 0.7,
      fontSize: 26, bold: true, color: style.bg,
      fontFace: 'Calibri',
    })
    // Accent underline
    pptSlide.addShape('rect', { x: 0.4, y: 1.65, w: 2.2, h: 0.055, fill: { color: style.accent } })

    // ── Bullet content ────────────────────────────────────────────────────
    const contentW = hasImage ? 5.6 : 9.2
    const bulletItems = (slide.content || []).map((item, idx) => ({
      text: item,
      options: {
        bullet:        { type: 'number' as const },
        color:         '1f2937',
        fontSize:      16,
        fontFace:      'Calibri',
        paraSpaceAfter: 8,
        breakLine:     true,
      },
    }))

    if (bulletItems.length > 0) {
      pptSlide.addText(bulletItems, {
        x: 0.4, y: 1.85, w: contentW, h: 3.0,
        fontSize: 16, color: '2d3748',
        fontFace: 'Calibri', valign: 'top',
        lineSpacing: 24,
      })
    }

    // ── Image panel ───────────────────────────────────────────────────────
    if (hasImage && imageData) {
      // Image background card
      pptSlide.addShape('rect', {
        x: 6.1, y: 0.85, w: 3.5, h: 3.6,
        fill: { color: style.contentBg },
        line: { color: style.accent, width: 2 },
        shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, opacity: 0.2 },
      })

      try {
        // Handle both data URIs and URLs
        const imgOptions: any = {
          x: 6.2, y: 0.95, w: 3.3, h: 3.4,
          rounding: true,
        }
        if (imageData.startsWith('data:')) {
          imgOptions.data = imageData
        } else {
          imgOptions.path = imageData
        }
        pptSlide.addImage(imgOptions)
      } catch (e) {
        console.warn(`⚠️ Could not embed image for slide "${slide.title}":`, e)
        // Show prompt text if image embed fails
        pptSlide.addText(slide.imagePrompt?.slice(0, 80) || 'Educational illustration', {
          x: 6.2, y: 0.95, w: 3.3, h: 3.4,
          fontSize: 12, color: style.accent, align: 'center', valign: 'middle',
          fontFace: 'Calibri',
        })
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────
    pptSlide.addShape('rect', { x: 0, y: 5.08, w: '100%', h: 0.28, fill: { color: 'f8fafc' } })

    pptSlide.addText('ElimuNova AI', {
      x: 0.4, y: 5.12, w: 3, h: 0.2,
      fontSize: 9, color: '94a3b8', fontFace: 'Arial',
    })

    const footerRight = [subject, grade].filter(Boolean).join(' • ')
    if (footerRight) {
      pptSlide.addText(footerRight, {
        x: 5.5, y: 5.12, w: 4.2, h: 0.2,
        fontSize: 9, color: style.bg, bold: true,
        fontFace: 'Arial', align: 'right',
      })
    }

    // Speaker notes
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes)
    }
  }

  // ── Closing Slide ─────────────────────────────────────────────────────────
  private addClosingSlide(pptx: PptxGenJS, title?: string, subject?: string, grade?: string) {
    const slide = pptx.addSlide()
    slide.background = { color: '0f172a' }

    // Top accent bar
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.12, fill: { color: '8b5cf6' } })

    // Decorative line art
    slide.addShape('rect', { x: 0.8, y: 1.0, w: 8.4, h: 0.015, fill: { color: '334155' } })

    // Thank you text
    slide.addText('Thank You', {
      x: 0.8, y: 1.4, w: 8.4, h: 1.2,
      fontSize: 44, bold: true, color: 'FFFFFF',
      fontFace: 'Calibri', align: 'center', valign: 'middle',
      shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, opacity: 0.3 },
    })

    // Decorative line
    slide.addShape('rect', { x: 3.5, y: 2.75, w: 3, h: 0.06, fill: { color: '8b5cf6' } })

    // Subtitle
    const meta = [subject, grade].filter(Boolean).join(' • ')
    slide.addText(meta || 'Keep Learning!', {
      x: 1, y: 3.0, w: 8, h: 0.5,
      fontSize: 16, color: '94a3b8', fontFace: 'Calibri', align: 'center',
    })

    // Bottom bar
    slide.addShape('rect', { x: 0, y: 5.2, w: '100%', h: 0.12, fill: { color: '1e3a5f' } })
    slide.addText('Powered by ElimuNova AI', {
      x: 0.4, y: 5.25, w: 9.2, h: 0.25,
      fontSize: 9, color: '94a3b8', fontFace: 'Arial', align: 'center',
    })
  }

  // ── Image generation ─────────────────────────────────────────────────────
  private async generateImages(
    slides: SimplePresentationSlide[],
    style: 'natural' | 'vivid',
    imageMap: Map<string, string>,
    userId?: string,
    teacherId?: string,
  ): Promise<void> {
    // Only generate for slides that have an imagePrompt, no pre-picked image, and need an image
    const imageSlides = slides.filter(s =>
      !s.imageUrl && s.imagePrompt && (s.layout === 'split' || s.layout === 'image')
    )

    // TutorBot only generates 2 images (title + 1 body) to reduce latency
    // We generate up to 3: first, one mid-body, last
    const targetIndices = new Set<number>()
    targetIndices.add(0)
    const mid = Math.floor(imageSlides.length / 2)
    if (mid > 0) targetIndices.add(mid)
    if (imageSlides.length > 1) targetIndices.add(imageSlides.length - 1)

    const targets = imageSlides.filter((_, i) => targetIndices.has(i))

    await Promise.allSettled(
      targets.map(async (slide) => {
        try {
          const bankMatch = await ImageBank.findMatching({
            prompt: slide.imagePrompt || slide.title,
            topic: slide.title,
          })

          if (bankMatch) {
            imageMap.set(slide.id, bankMatch.url)
            console.log(`✅ Image reused from bank for "${slide.title}" (${bankMatch.usageCount} previous uses)`)
            return
          }

          const enhanced = `Educational diagram or illustration for ${slide.imagePrompt}. Clean, textbook-quality, high-contrast, suitable for classroom projection. No watermarks, no text overlays.`
          const result = await OpenAIService.generateImage({
            prompt:  enhanced,
            style,
            size:    '1024x1024',
            quality: 'standard',
          })

          if (result.url) {
            // Convert remote URL to base64 for embedding (data URIs work everywhere)
            if (result.url.startsWith('data:')) {
              imageMap.set(slide.id, result.url)
            } else {
              try {
                const resp = await fetch(result.url)
                const buf  = Buffer.from(await resp.arrayBuffer())
                imageMap.set(slide.id, `data:image/png;base64,${buf.toString('base64')}`)
              } catch (e) {
                console.warn('[PresentationGen] Buffer conversion failed:', e)
                imageMap.set(slide.id, result.url) // use URL directly as fallback
              }
            }
            console.log(`✅ Image ready for "${slide.title}" (${result.provider})`)

            // Save to DB (non-blocking)
            if ((userId || teacherId) && !result.provider.includes('placeholder')) {
              this.saveImageToDatabase(result.url, slide.title, slide.imagePrompt || '', userId, teacherId, result.provider || 'pollinations')
                .catch(() => {})
            }
          }
        } catch (e) {
          console.warn(`⚠️ Image skipped for "${slide.title}":`, e instanceof Error ? e.message : e)
        }
      })
    )
  }

  private async saveImageToDatabase(url: string, title: string, prompt: string, userId?: string, teacherId?: string, provider?: string) {
    try {
      await ImageBank.save({
        imageUrl:   url,
        prompt,
        topic:      title,
        type:       'ILLUSTRATION',
        size:       'MEDIUM_1024',
        quality:    'standard',
        userId:     userId || '',
        teacherId:  teacherId ?? undefined,
        provider:   provider || 'pollinations',
      })
    } catch (e) { console.error('[IMG_SAVE] Failed to save image to bank', e) }
  }

  /**
   * Convert a remote URL or data URI to a base64 data URI PptxGenJS can embed.
   */
  private async toEmbeddable(url: string, id: string): Promise<string | undefined> {
    try {
      if (url.startsWith('data:')) return url
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`fetch ${resp.status}`)
      const buf = Buffer.from(await resp.arrayBuffer())
      const contentType = resp.headers.get('content-type') || 'image/png'
      return `data:${contentType};base64,${buf.toString('base64')}`
    } catch (e) {
      console.warn(`⚠️ Could not load pre-picked image for "${id}":`, e instanceof Error ? e.message : e)
      return undefined
    }
  }
}

export const simplePresentationGenerator = new SimplePresentationGenerator()

export async function generateSimplePresentation(options: {
  title:         string
  slides:        any[]
  includeImages?: boolean
  subject?:      string
  grade?:        string
  userId?:       string
  teacherId?:    string
}): Promise<Buffer> {
  const formattedSlides: SimplePresentationSlide[] = options.slides.map((s, i) => ({
    id:          s.id    || `slide-${i}`,
    title:       s.title || `Slide ${i + 1}`,
    content:     Array.isArray(s.content) ? s.content : [s.content || ''],
    imagePrompt: s.imagePrompt || s.imageDescription,
    layout:      s.layout || 'split',
    section:     s.section,
    speakerNotes: s.speakerNotes || s.speaker_notes,
  }))

  return simplePresentationGenerator.generatePresentation({
    title:          options.title,
    author:         'ElimuNova AI Teacher',
    subject:        options.subject,
    grade:          options.grade,
    slides:         formattedSlides,
    generateImages: options.includeImages ?? true,
    imageStyle:     'natural',
    userId:         options.userId,
    teacherId:      options.teacherId,
  })
}
