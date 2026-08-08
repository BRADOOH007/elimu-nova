import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import * as XLSX from 'xlsx'

// Simple timetable parser: expects columns as time slots and rows as grades
function parseTimetable(buffer: Buffer): Array<{
  grade: string; dayOfWeek: string; startTime: string; endTime: string; subjectName: string; teacherId?: string; room?: string
}> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  if (rows.length < 3) return []

  // Row 0 = header (e.g. ["", "MONDAY", "", "", "TUESDAY", ...])
  // Row 1 = time slots (e.g. ["GRADE", "8:10-8:50", "8:55-9:35", ..., "8:10-8:50", ...])
  // Row 2+ = grade rows (e.g. ["Grade 4", "MATHS", "ENG", ...])
  const headerRow = rows[0] as string[]
  const timeRow = rows[1] as string[]

  // Build day-to-column mapping
  const dayMap: { day: string; colStart: number; colEnd: number; times: { start: string; end: string; col: number }[] }[] = []
  let currentDay = ''
  let dayStart = -1
  for (let c = 1; c < headerRow.length; c++) {
    const cell = String(headerRow[c] || '').toUpperCase()
    const dayMatch = cell.match(/MON|TUE|WED|THU|FRI/)
    if (dayMatch) {
      if (dayStart >= 0 && currentDay) {
        dayMap.push({ day: currentDay, colStart: dayStart, colEnd: c - 1, times: [] })
      }
      currentDay = dayMatch[0]
      dayStart = c
    }
  }
  if (dayStart >= 0 && currentDay) dayMap.push({ day: currentDay, colStart: dayStart, colEnd: headerRow.length - 1, times: [] })

  // Map time slots
  for (const dm of dayMap) {
    for (let c = dm.colStart; c <= dm.colEnd; c++) {
      const t = String(timeRow[c] || '').trim()
      const m = t.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
      if (m) dm.times.push({ start: m[1], end: m[2], col: c })
    }
  }

  // Extract data rows
  const results: any[] = []
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r]
    const grade = String(row[0] || '').trim()
    if (!grade || grade.toLowerCase().includes('grade') === false) continue

    for (const dm of dayMap) {
      for (const t of dm.times) {
        const cell = String(row[t.col] || '').trim()
        if (!cell) continue
        // Try to extract subject and teacher code (e.g., "MATHS 6" → Mathematics, teacher code 6)
        const parts = cell.split(/\s+/)
        const subjectName = parts[0] || cell
        const teacherCode = parts.length > 1 ? parts[parts.length - 1] : undefined
        results.push({
          grade, dayOfWeek: dm.day, startTime: t.start, endTime: t.end,
          subjectName, teacherCode, room: undefined,
        })
      }
    }
  }

  return results
}

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const replaceAll = formData.get('replaceAll') === 'true'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let parsed = parseTimetable(buffer)

  // AI fallback: if parsing produced very few results, try AI extraction
  if (parsed.length < 3) {
    try {
      const { OpenAIService } = await import('@/lib/openai-service')
      // Convert XLSX to CSV text for the LLM
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]])
      const prompt = `Extract ALL timetable entries from this school timetable Excel data. Return ONLY valid JSON array:
[{ "grade": "Grade 4", "dayOfWeek": "MON", "startTime": "08:10", "endTime": "08:50", "subjectName": "Mathematics", "teacherCode": "6" }]
Grade values must include "Grade" prefix. DayOfWeek must be MON/TUE/WED/THU/FRI. Times in HH:MM format.
CSV data:\n${csv.slice(0, 8000)}`
      const raw = await OpenAIService.generateText([{ role: 'user', content: prompt }], { maxTokens: 3000, temperature: 0.1 })
      const json = raw.match(/\[[\s\S]*\]/)?.[0]
      if (json) parsed = JSON.parse(json)
    } catch { /* AI fallback failed, use whatever we parsed */ }
  }

  // Map teacher codes to actual teacher IDs
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: admin.schoolId },
    include: { user: { select: { id: true } } },
  })

  // Try matching teacher by a simple code (e.g., last digit of email or index)
  const teacherMap = new Map<string, string>()
  teachers.forEach((t, i) => { teacherMap.set(String(i + 1), t.id) })

  if (replaceAll) {
    await (prisma as any).timetableSlot.deleteMany({ where: { schoolId: admin.schoolId } })
  }

  const created: any[] = []
  for (const slot of parsed) {
    const teacherId = slot.teacherCode ? teacherMap.get(String(slot.teacherCode)) : undefined
    const record = await (prisma as any).timetableSlot.create({
      data: {
        schoolId: admin.schoolId, grade: slot.grade, dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime, endTime: slot.endTime, subjectName: slot.subjectName,
        teacherId: teacherId || null, room: slot.room || null,
      },
    })
    created.push(record)
  }

  return NextResponse.json({ count: created.length, preview: created.slice(0, 20) })
})
