import { NextResponse } from 'next/server'
import { ImageGenerationService } from '@/lib/image-generation'
import { ImageBank } from '@/lib/image-bank'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { user }) => {
  let parsedBody: any = {}
  try {
    parsedBody = await request.json()
  } catch (e) {
    console.warn('[Image] Invalid request body:', e)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

    const {
      prompt,
      style = 'natural',
      size = '1024x1024',
      quality = 'standard',
      provider = 'auto',
      subject,
      grade,
      topic,
      contextType,
      contextId,
    } = parsedBody

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const displayTopic = topic || prompt.substring(0, 100)
    const schoolId = user.schoolAdminId || undefined

    const cached = await ImageBank.findMatching({
      prompt,
      subject,
      grade,
      topic: displayTopic,
      schoolId,
    })

    if (cached) {
      if (contextType && contextId) {
        await ImageBank.trackUsage({
          imageId: cached.id,
          contextType: contextType as any,
          contextId,
          userId: user.id,
        })
      }

      return NextResponse.json({
        imageUrl: cached.url,
        success: true,
        source: cached.subject ? 'image-bank' : 'image-bank',
        fromBank: true,
        bankEntry: cached,
        revisedPrompt: cached.prompt,
        message: 'Found matching image in shared bank — no AI call needed.',
      })
    }

    const imageService = new ImageGenerationService()
    const result = await imageService.generateImage({
      prompt,
      style: style === 'educational' ? 'natural' : style,
      size,
      quality,
      provider,
    })

    const isPlaceholder = result.provider === 'placeholder'
    let savedEntry = null

    if (!isPlaceholder) {
      savedEntry = await ImageBank.save({
        imageUrl: result.url,
        prompt,
        topic: displayTopic,
        subject,
        grade,
        type: style === 'educational' || style === 'diagram' ? 'DIAGRAM' : 'GENERAL',
        size: sizeToDbSize(size),
        quality,
        userId: user.id,
        teacherId: user.role === 'TEACHER' ? user.teacherId : undefined,
        schoolId,
        provider: result.provider,
      })

      if (contextType && contextId && savedEntry) {
        await ImageBank.trackUsage({
          imageId: savedEntry.id,
          contextType: contextType as any,
          contextId,
          userId: user.id,
        })
      }
    }

    return NextResponse.json({
      imageUrl: isPlaceholder ? result.url : savedEntry?.url || result.url,
      success: true,
      source: result.provider,
      fromBank: false,
      bankEntry: savedEntry,
      revisedPrompt: result.revisedPrompt,
      metadata: result.metadata,
    })
})

function sizeToDbSize(size: string): string {
  const map: Record<string, string> = {
    '512x512': 'SMALL_512',
    '1024x1024': 'MEDIUM_1024',
    '1536x1024': 'LARGE_1536',
    '1024x1536': 'PORTRAIT_1024',
    '1792x1024': 'LARGE_1536',
    '1024x1792': 'PORTRAIT_1024',
  }
  return map[size] || 'MEDIUM_1024'
}

function generatePlaceholderImage(prompt: string, style: string): string {
  const width = 400
  const height = 300
  const displayText = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    educational: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
    professional: { bg: '#f8fafc', border: '#64748b', text: '#334155' },
    creative: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    default: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  }
  const colorScheme = colors[style] || colors.default
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colorScheme.bg}" stroke="${colorScheme.border}" stroke-width="2" rx="8"/>
    <circle cx="${width / 2}" cy="${height / 2 - 20}" r="30" fill="${colorScheme.border}" opacity="0.3"/>
    <text x="${width / 2}" y="${height / 2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${colorScheme.text}" font-weight="bold">ElimuNova AI Image</text>
    <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${colorScheme.text}" opacity="0.7">${displayText}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
