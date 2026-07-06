/**
 * POST /api/teacher/bulk-upload-students
 * Bulk Student Upload — CSV/paste → creates all students with auto credentials
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function generatePassword(): string {
  const adjs  = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold']
  const nouns = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest']
  return `${adjs[Math.floor(Math.random()*adjs.length)]}${nouns[Math.floor(Math.random()*nouns.length)]}${Math.floor(100+Math.random()*900)}`
}

function generateEmail(first: string, last: string, suffix?: string): string {
  const base = `${first.toLowerCase().replace(/\s+/g,'')}.${last.toLowerCase().replace(/\s+/g,'')}`
  return suffix ? `${base}.${suffix}@student.local` : `${base}@student.local`
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''; let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['TEACHER','SCHOOL_ADMIN','SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { csvText, classId, grade } = await request.json()
    if (!csvText?.trim()) return NextResponse.json({ error: 'csvText required' }, { status: 400 })

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    // Parse CSV — expected columns: firstName, lastName, email(optional), phone(optional)
    const lines = csvText.trim().split('\n').filter((l: string) => l.trim())
    const headers = parseCSVLine(lines[0]).map((h: string) => h.toLowerCase().replace(/\s+/g,''))
    const dataLines = lines.slice(1) // skip header row if present

    // Detect if first row is a header
    const hasHeader = headers.some((h: string) => ['firstname','first_name','first','name','student'].includes(h))
    const rows = hasHeader ? dataLines : lines

    const results: { name: string; email: string; password: string; status: 'created'|'skipped'; reason?: string }[] = []
    let created = 0; let skipped = 0

    for (const line of rows) {
      if (!line.trim()) continue
      const cols = parseCSVLine(line)

      let firstName = ''; let lastName = ''; let email = ''; let phone = ''

      if (hasHeader) {
        // Map by header name
        headers.forEach((h, i) => {
          const val = (cols[i] || '').trim()
          if (['firstname','first_name','first'].includes(h)) firstName = val
          else if (['lastname','last_name','last','surname'].includes(h)) lastName = val
          else if (['name','fullname','full_name'].includes(h) && !firstName) {
            const parts = val.split(' ')
            firstName = parts[0] || ''
            lastName = parts.slice(1).join(' ') || ''
          }
          else if (['email','e-mail','mail'].includes(h)) email = val
          else if (['phone','tel','mobile'].includes(h)) phone = val
        })
      } else {
        // Assume: firstName, lastName [, email] [, phone]
        if (cols.length === 1) {
          const parts = cols[0].split(' ')
          firstName = parts[0] || ''; lastName = parts.slice(1).join(' ') || ''
        } else {
          firstName = cols[0] || ''; lastName = cols[1] || ''
          email = cols[2] || ''; phone = cols[3] || ''
        }
      }

      if (!firstName) { skipped++; results.push({ name: line.slice(0,30), email:'', password:'', status:'skipped', reason:'No first name' }); continue }
      if (!lastName) lastName = firstName // single name students

      // Generate login
      let loginEmail = email.trim() || generateEmail(firstName, lastName)

      // Check uniqueness
      const existing = await prisma.user.findUnique({ where: { email: loginEmail } })
      if (existing) {
        loginEmail = generateEmail(firstName, lastName, Date.now().toString().slice(-4))
        const stillExists = await prisma.user.findUnique({ where: { email: loginEmail } })
        if (stillExists) {
          skipped++
          results.push({ name: `${firstName} ${lastName}`, email: loginEmail, password:'', status:'skipped', reason:'Email conflict' })
          continue
        }
      }

      const plainPwd = generatePassword()
      const hashedPwd = await bcrypt.hash(plainPwd, 10)
      const addressWithPwd = `PWD:${plainPwd}`

      try {
        const user = await prisma.user.create({
          data: { firstName, lastName, email: loginEmail, password: hashedPwd, role:'STUDENT', isActive:true, phone: phone||null, address: addressWithPwd }
        })
        await prisma.student.create({
          data: { userId: user.id, schoolId: teacher.schoolId, teacherId: teacher.id, classId: classId||null }
        })
        created++
        results.push({ name:`${firstName} ${lastName}`, email: loginEmail, password: plainPwd, status:'created' })
      } catch (e: any) {
        skipped++
        results.push({ name:`${firstName} ${lastName}`, email: loginEmail, password:'', status:'skipped', reason: e.message?.slice(0,60) })
      }
    }

    return NextResponse.json({ created, skipped, total: rows.length, results })
  } catch (e: any) {
    console.error('[BULK_UPLOAD]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
