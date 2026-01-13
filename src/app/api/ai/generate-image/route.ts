import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'
import ImageStorageService from '@/lib/image-storage-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, style = 'natural', size = '1024x1024', quality = 'standard' } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log('Generating image with OpenAI DALL-E 3, prompt:', prompt)

    // Generate image using OpenAI DALL-E 3
    const result = await OpenAIService.generateImage({
      prompt,
      style: style === 'educational' ? 'natural' : style, // Map educational to natural
      size,
      quality
    })

    // Save the image to storage
    const sizeMapping = {
      '512x512': 'SMALL_512',
      '1024x1024': 'MEDIUM_1024',
      '1536x1024': 'LARGE_1536',
      '1024x1536': 'PORTRAIT_1024'
    } as const

    const imageType = style === 'educational' || style === 'diagram' ? 'DIAGRAM' : 'GENERAL'

    const savedImage = await ImageStorageService.saveAIImage({
      imageUrl: result.url,
      topic: prompt.substring(0, 100), // Use first 100 chars of prompt as topic
      prompt,
      type: imageType,
      size: sizeMapping[size as keyof typeof sizeMapping] || 'MEDIUM_1024',
      quality,
      userId: session.user.id,
      studentId: session.user.role === 'STUDENT' ? session.user.studentId : undefined,
      teacherId: session.user.role === 'TEACHER' ? session.user.teacherId : undefined,
      schoolId: session.user.schoolAdminId ? session.user.schoolAdminId : undefined,
      metadata: {
        style,
        revisedPrompt: result.revisedPrompt,
        provider: result.provider,
        generatedAt: new Date().toISOString(),
        originalMetadata: result.metadata
      }
    })

    // Track usage
    await ImageStorageService.trackImageUsage(
      savedImage.id,
      session.user.id,
      'generation',
      'image_generator'
    )

    return NextResponse.json({
      imageUrl: savedImage.storedUrl, // Use stored URL instead of temporary OpenAI URL
      success: true,
      source: 'openai-dalle-3',
      revisedPrompt: result.revisedPrompt,
      metadata: result.metadata,
      saved_image: {
        id: savedImage.id,
        filename: savedImage.filename,
        fileSize: savedImage.fileSize,
        dimensions: savedImage.dimensions
      }
    })

  } catch (error) {
    console.error('OpenAI image generation error:', error)
    
    // Return a placeholder image on error
    const placeholderImageUrl = generatePlaceholderImage(
      (await request.json()).prompt || 'Educational Content', 
      'educational'
    )
    
    return NextResponse.json({
      imageUrl: placeholderImageUrl,
      success: true,
      source: 'placeholder',
      message: 'OpenAI image generation temporarily unavailable. Using placeholder image.',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Generate a placeholder image using SVG
function generatePlaceholderImage(prompt: string, style: string): string {
  const width = 400
  const height = 300
  
  // Clean the prompt for display
  const displayText = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')
  
  // Choose colors based on style
  const colors = {
    educational: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
    professional: { bg: '#f8fafc', border: '#64748b', text: '#334155' },
    creative: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    default: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
  }
  
  const colorScheme = colors[style as keyof typeof colors] || colors.default
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${colorScheme.bg}" stroke="${colorScheme.border}" stroke-width="2" rx="8"/>
      <circle cx="${width/2}" cy="${height/2 - 20}" r="30" fill="${colorScheme.border}" opacity="0.3"/>
      <text x="${width/2}" y="${height/2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${colorScheme.text}" font-weight="bold">
        🎨 ElimuNova AI Image
      </text>
      <text x="${width/2}" y="${height/2 + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${colorScheme.text}" opacity="0.7">
        ${displayText}
      </text>
      <text x="${width/2}" y="${height - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${colorScheme.text}" opacity="0.5">
        Powered by OpenAI DALL-E 3
      </text>
    </svg>
  `
  
  // Convert SVG to data URL
  const encodedSvg = encodeURIComponent(svg)
  return `data:image/svg+xml,${encodedSvg}`
}