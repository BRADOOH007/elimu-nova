import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Parse date strings like "14TH-16TH SEPT 2026", "24TH AUG 2026", "14TH APRIL 2026"
function parseDateRange(text: string): { start: Date; end: Date } | null {
  const clean = text.trim().toUpperCase()
  // Range: "14TH-16TH SEPT 2026"
  const range = clean.match(/(\d{1,2})(?:ST|ND|RD|TH)?\s*[-–]\s*(\d{1,2})(?:ST|ND|RD|TH)?\s+(\w+)\s+(\d{4})/)
  if (range) {
    const months: Record<string, number> = {
      JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11,
      JANUARY:0,FEBRUARY:1,MARCH:2,APRIL:3,JUNE:5,JULY:6,AUGUST:7,SEPTEMBER:8,OCTOBER:9,NOVEMBER:10,DECEMBER:11,
    }
    const month = months[range[3]] ?? 0
    const year = parseInt(range[4])
    return {
      start: new Date(year, month, parseInt(range[1])),
      end: new Date(year, month, parseInt(range[2])),
    }
  }
  // Single date: "24TH AUG 2026"
  const single = clean.match(/(\d{1,2})(?:ST|ND|RD|TH)?\s+(\w+)\s+(\d{4})/)
  if (single) {
    const months: Record<string, number> = {
      JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11,
      JANUARY:0,FEBRUARY:1,MARCH:2,APRIL:3,JUNE:5,JULY:6,AUGUST:7,SEPTEMBER:8,OCTOBER:9,NOVEMBER:10,DECEMBER:11,
    }
    const month = months[single[2]] ?? 0
    const dt = new Date(parseInt(single[3]), month, parseInt(single[1]))
    return { start: dt, end: dt }
  }
  return null
}

// Categorize events by keyword
function categorize(title: string): string {
  const t = title.toUpperCase()
  if (t.includes('KPSEA') || t.includes('KJSEA') || t.includes('KCSE') || t.includes('KCPE') || t.includes('EXAM') || t.includes('ASSESSMENT')) return 'EXAM'
  if (t.includes('HALF TERM') || t.includes('HOLIDAY') || t.includes('BREAK') || t.includes('CLOSING') || t.includes('OPENING')) return 'HOLIDAY'
  if (t.includes('MEETING') || t.includes('STAFF')) return 'MEETING'
  if (t.includes('SPORTS') || t.includes('SWIMMING') || t.includes('MUSIC') || t.includes('DRAMA') || t.includes('DEBATE')) return 'CO_CURRICULAR'
  return 'ACADEMIC'
}

function parseCalendarText(text: string): Array<{
  title: string; startDate: string; endDate: string; category: string; targetAudience: string; description: string
}> {
  const events: any[] = []
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 2)
  let currentTitle = ''

  for (const line of lines) {
    // Look for date patterns: either standalone or after event names
    const dateRange = parseDateRange(line)
    if (dateRange) {
      // The previous line(s) may contain the event name
      const title = currentTitle || line.replace(/\d.*$/, '').trim() || 'Untitled Event'
      events.push({
        title,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        category: categorize(title),
        targetAudience: title.toUpperCase().includes('STAFF') || title.toUpperCase().includes('TEACHER') ? 'TEACHERS' : 'ALL',
        description: title,
      })
      currentTitle = ''
    } else {
      currentTitle = line
    }
  }

  return events
}

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const replaceAll = formData.get('replaceAll') === 'true'
  const textInput = formData.get('text') as string | null

  if (!file && !textInput) return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })

  let rawText = textInput || ''

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      const pdfModule = await import('pdf-parse')
      const PDFParse = pdfModule.PDFParse
      const result = await new PDFParse({ data: buffer }).getText({})
      rawText = result.text || ''
    } catch {
      // Try reading as plain text
      rawText = buffer.toString('utf-8')
    }
  }

  let parsed = parseCalendarText(rawText)

  // AI fallback for complex documents
  if (parsed.length < 2 && rawText.length > 50) {
    try {
      const { OpenAIService } = await import('@/lib/openai-service')
      const prompt = `Extract all school calendar events from this text. Return ONLY valid JSON array:
[{ "title": "Term 2 Opening", "startDate": "2026-05-04", "endDate": "2026-05-04", "category": "ACADEMIC", "targetAudience": "ALL", "description": "School opens for Term 2" }]
Categories: ACADEMIC, EXAM, HOLIDAY, CO_CURRICULAR, MEETING. Target audiences: ALL, TEACHERS, STUDENTS, PARENTS.
Text:\n${rawText.slice(0, 10000)}`
      const raw = await OpenAIService.generateText([{ role: 'user', content: prompt }], { maxTokens: 3000, temperature: 0.1 })
      const json = raw.match(/\[[\s\S]*\]/)?.[0]
      if (json) parsed = JSON.parse(json)
    } catch { /* AI fallback failed */ }
  }

  if (replaceAll) {
    await (prisma as any).academicCalendarEvent.deleteMany({ where: { schoolId: admin.schoolId } })
  }

  const created: any[] = []
  for (const event of parsed) {
    const record = await (prisma as any).academicCalendarEvent.create({
      data: {
        schoolId: admin.schoolId, title: event.title, category: event.category || 'ACADEMIC',
        startDate: new Date(event.startDate), endDate: new Date(event.endDate),
        targetAudience: event.targetAudience || 'ALL', targetGrade: (event as any).targetGrade || null,
        description: event.description || null,
      },
    })
    created.push(record)
  }

  return NextResponse.json({ count: created.length, preview: created.slice(0, 20) })
})
