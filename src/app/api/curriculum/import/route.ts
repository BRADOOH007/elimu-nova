import { NextResponse } from 'next/server'
import { route, apiLogger } from '@/lib/api-middleware'
import { importCurriculumFromLink, extractGoogleDriveFileId } from '@/lib/curriculum-importer'

const log = apiLogger('curriculum/import')

export const dynamic = 'force-dynamic'

export const POST = route({ auth: ['SCHOOL_ADMIN', 'TEACHER'] }, async (req, { user }) => {
  try {
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { url, grade, subject, term, name, description } = body || {}

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }
    if (!grade || typeof grade !== 'string') {
      return NextResponse.json({ error: 'grade is required' }, { status: 400 })
    }
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'subject is required' }, { status: 400 })
    }

    const fileId = extractGoogleDriveFileId(url)
    if (!fileId) {
      return NextResponse.json(
        { error: 'Could not parse a Google Drive file id from that link' },
        { status: 400 }
      )
    }

    const termNum = term === undefined || term === null ? null : Number(term)
    const nameStr = typeof name === 'string' ? name : undefined
    const descStr = typeof description === 'string' ? description : undefined

    const result = await importCurriculumFromLink({
      url,
      grade,
      subject,
      term: Number.isFinite(termNum as number) ? termNum : null,
      name: nameStr,
      description: descStr,
    })

    log.info(`Imported ${grade} ${subject} (${result.strandCount} strands, ${result.substrandCount} substrands) by ${user.id}`)

    return NextResponse.json({
      success: true,
      ...result,
      message: `Imported ${result.strandCount} strands / ${result.substrandCount} substrands for ${grade} ${subject}`,
    })
  } catch (error) {
    log.error('Curriculum import failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import curriculum' },
      { status: 500 }
    )
  }
})
