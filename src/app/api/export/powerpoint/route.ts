import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { simplePresentationGenerator } from '@/lib/simple-presentation-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, format = 'pptx', slides: directSlides } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    console.log('📊 Exporting PowerPoint:', title, '| format:', format)

    // Normalise slide data — handle both old (slideType/string content) and new (layout/array content) shapes
    const rawSlides: any[] = directSlides || content?.slides || []

    const normalisedSlides = rawSlides.map((s: any, i: number) => {
      // Determine layout
      let layout: 'title' | 'content' | 'image' | 'split' = 'content'
      if (s.layout === 'title'   || s.slideType === 'title')   layout = 'title'
      else if (s.layout === 'image'   || s.slideType === 'image')   layout = 'image'
      else if (s.layout === 'split'   || s.slideType === 'split')   layout = 'split'

      // Normalise content to string[]
      let contentArr: string[] = []
      if (Array.isArray(s.content)) {
        contentArr = s.content.flatMap((c: any) =>
          typeof c === 'string' ? c.split('\n') : []
        ).filter(Boolean)
      } else if (typeof s.content === 'string') {
        contentArr = s.content.split('\n').filter(Boolean)
      }

      // Image prompt — prefer explicit, fall back to visualSuggestions joined
      const imagePrompt: string | undefined =
        s.imagePrompt ||
        (Array.isArray(s.visualSuggestions) ? s.visualSuggestions.join(', ') : undefined) ||
        (layout === 'split' || layout === 'image'
          ? `Educational illustration for ${s.title || 'lesson content'}`
          : undefined)

      return {
        id:          s.id || `slide-${i}`,
        title:       s.title || `Slide ${i + 1}`,
        content:     contentArr.length > 0 ? contentArr : ['Content for this slide'],
        imagePrompt,
        layout,
      }
    })

    // Generate the PPTX buffer — always uses SimplePresentationGenerator (safe, has SVG fallback)
    const buffer = await simplePresentationGenerator.generatePresentation({
      title,
      author:         session.user.name || 'ElimuNova Teacher',
      slides:         normalisedSlides,
      generateImages: format !== 'pdf', // skip images for PDF export
      imageStyle:     'natural',
      userId:         session.user.id,
    })

    const contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    const safeTitle   = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename    = `${safeTitle}.pptx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('PowerPoint export error:', error)
    return NextResponse.json(
      {
        error:   'Failed to export PowerPoint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
