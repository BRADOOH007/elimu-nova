import { NextResponse } from 'next/server'
import { simplePresentationGenerator } from '@/lib/simple-presentation-generator'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  const { title, content, format = 'pptx', slides: directSlides } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  console.log('📊 Exporting PowerPoint:', title, '| format:', format)

  const rawSlides: any[] = directSlides || content?.slides || []

  const normalisedSlides = rawSlides.map((s: any, i: number) => {
    let layout: 'title' | 'content' | 'image' | 'split' = 'content'
    if (s.layout === 'title'   || s.slideType === 'title')   layout = 'title'
    else if (s.layout === 'image'   || s.slideType === 'image')   layout = 'image'
    else if (s.layout === 'split'   || s.slideType === 'split')   layout = 'split'

    let contentArr: string[] = []
    if (Array.isArray(s.content)) {
      contentArr = s.content.flatMap((c: any) =>
        typeof c === 'string' ? c.split('\n') : []
      ).filter(Boolean)
    } else if (typeof s.content === 'string') {
      contentArr = s.content.split('\n').filter(Boolean)
    }

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
      imageUrl:    s.imageUrl || undefined,
      layout,
    }
  })

  const buffer = await simplePresentationGenerator.generatePresentation({
    title,
    author:         user.name || 'ElimuNova Teacher',
    slides:         normalisedSlides,
    generateImages: format !== 'pdf',
    imageStyle:     'natural',
    userId:         user.id,
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
})
