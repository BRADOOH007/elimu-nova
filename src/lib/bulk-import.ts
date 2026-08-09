import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encryptPassword } from '@/lib/password-encryption'

/* ── Smart Header Aliases ── */
const HEADER_ALIASES: Record<string, string[]> = {
  firstName:  ['firstname','first_name','first','given_name','givenname'],
  lastName:   ['lastname','last_name','last','surname','family_name','familyname'],
  fullName:   ['name','fullname','full_name','student_name','studentname','child_name','childname'],
  email:      ['email','e-mail','mail','email_address','emailaddress'],
  phone:      ['phone','tel','mobile','telephone','phone_number','phonenumber','contact'],
  grade:      ['grade','class','level','form','standard','year','stream'],
  admission:  ['admission','admission_number','admission_no','adm','student_id','studentid','reg_no','regno'],
  gender:     ['gender','sex'],
}

export interface ImportRow {
  firstName:  string
  lastName:   string
  email:      string
  phone?:     string
  grade?:     string
  admission?: string
  gender?:    string
  raw:        string
}

export interface ImportResult {
  name:     string
  email:    string
  username: string
  password: string
  status:   'created' | 'skipped'
  reason?:  string
}

export interface ImportSummary {
  created: number
  skipped: number
  total:   number
  results: ImportResult[]
}

/* ── Password Generation ── */
const ADJS  = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold','Clever','Golden']
const NOUNS = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest','Tiger','Falcon']

export function generatePassword(): string {
  return `${ADJS[Math.floor(Math.random() * ADJS.length)]}${NOUNS[Math.floor(Math.random() * NOUNS.length)]}${Math.floor(100 + Math.random() * 900)}`
}

/* ── Email Generation ── */
export function generateEmail(first: string, last: string, suffix?: string, domain = 'student.local'): string {
  const base = `${first.toLowerCase().replace(/[^a-z0-9]/g, '')}.${last.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  return suffix ? `${base}.${suffix}@${domain}` : `${base}@${domain}`
}

/* ── Username Generation ── */
export function generateUsername(first: string, last: string, suffix?: string): string {
  const base = `${first.toLowerCase().replace(/[^a-z0-9]/g, '')}.${last.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  return suffix ? `${base}.${suffix}` : base
}

/* ── CSV Parsing ── */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

/* ── Smart Header Detection ── */
export function detectHeaders(headers: string[]): { firstName: number; lastName: number; email: number; phone: number; grade: number; admission: number; gender: number } {
  const idx = { firstName: -1, lastName: -1, email: -1, phone: -1, grade: -1, admission: -1, gender: -1 }
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().replace(/[\s_-]/g, '')
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some(a => lower === a || lower === a.replace(/[\s_-]/g, ''))) {
        idx[field as keyof typeof idx] = i
      }
    }
  })
  return idx
}

/* ── Parse Rows → ImportRow[] ── */
export function parseRows(lines: string[], hasHeader: boolean): ImportRow[] {
  const rows: ImportRow[] = []
  const dataLines = hasHeader ? lines.slice(1) : lines

  const headerIdx = hasHeader ? detectHeaders(parseCSVLine(lines[0])) : null

  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    const row: ImportRow = { firstName: '', lastName: '', email: '', raw: line }

    if (headerIdx) {
      row.firstName  = cols[headerIdx.firstName]?.trim() || ''
      row.lastName   = cols[headerIdx.lastName]?.trim() || ''
      row.email      = cols[headerIdx.email]?.trim() || ''
      row.phone      = cols[headerIdx.phone]?.trim() || ''
      row.grade      = cols[headerIdx.grade]?.trim() || ''
      row.admission  = cols[headerIdx.admission]?.trim() || ''
      row.gender     = cols[headerIdx.gender]?.trim() || ''

      // Full-name column fallback
      if (!row.firstName && headerIdx.firstName < 0) {
        // fallback: check columns for "name"
        const parts = line.split(',')
        for (let i = 0; i < parts.length; i++) {
          const h = parseCSVLine(lines[0])[i]?.toLowerCase() || ''
          if (['name','fullname','full_name','student_name','studentname'].some(a => h.includes(a))) {
            const nameParts = parts[i].trim().split(' ')
            row.firstName = nameParts[0] || ''
            row.lastName = nameParts.slice(1).join(' ') || ''
            break
          }
        }
      }
    } else {
      // No header: positional
      if (cols.length === 1) {
        const parts = cols[0].split(' ')
        row.firstName = parts[0] || ''
        row.lastName = parts.slice(1).join(' ') || ''
      } else {
        row.firstName = cols[0]?.trim() || ''
        row.lastName = cols[1]?.trim() || ''
        row.email = cols[2]?.trim() || ''
        row.phone = cols[3]?.trim() || ''
        row.grade = cols[4]?.trim() || ''
        row.admission = cols[5]?.trim() || ''
      }
    }

    if (!row.firstName) row.firstName = ''
    if (!row.lastName) row.lastName = row.firstName

    rows.push(row)
  }
  return rows
}

/* ── Class Auto-Match / Create ── */
export async function resolveClassId(grade: string | undefined, schoolId: string, teacherId?: string): Promise<string | null> {
  if (!grade) return null
  const normalized = grade.trim()
  const existing = await prisma.class.findFirst({
    where: {
      schoolId,
      OR: [
        { name: { equals: normalized, mode: 'insensitive' } },
        { grade: { equals: normalized, mode: 'insensitive' } },
      ],
    },
  })
  if (existing) return existing.id
  if (!teacherId) return null
  const created = await prisma.class.create({
    data: {
      name: normalized,
      subject: normalized,
      grade: normalized,
      schoolId,
      teacherId,
    },
  })
  return created.id
}

/* ── Create Student (single, in a transaction) ── */
export async function createStudentUser(
  row: ImportRow,
  schoolId: string,
  teacherId?: string,
  classId?: string | null,
): Promise<{ email: string; password: string; username: string }> {
  // Determine email
  let email = row.email.trim().toLowerCase()
  if (!email) {
    email = generateEmail(row.firstName, row.lastName)
  }

  // Check email uniqueness; retry with suffix if needed
  let existing = await prisma.user.findUnique({ where: { email } })
  let suffixAttempt = 0
  while (existing) {
    suffixAttempt++
    email = generateEmail(row.firstName, row.lastName, `${Date.now().toString(36)}${suffixAttempt}`)
    existing = await prisma.user.findUnique({ where: { email } })
  }

  // Generate unique username
  let username = generateUsername(row.firstName, row.lastName)
  while (await prisma.user.findUnique({ where: { username } })) {
    suffixAttempt++
    username = generateUsername(row.firstName, row.lastName, `${Date.now().toString(36)}${suffixAttempt}`)
  }

  const plainPwd = generatePassword()
  const hashedPwd = await bcrypt.hash(plainPwd, 10)
  const addressWithPwd = encryptPassword(plainPwd)

  // Derive the teacherId from the assigned class when not passed explicitly,
  // so the student appears in that teacher's roster/dashboard immediately.
  let resolvedTeacherId = teacherId || null
  if (!resolvedTeacherId && classId) {
    const cls = await prisma.class.findFirst({
      where: { id: classId },
      select: { teacherId: true },
    })
    resolvedTeacherId = cls?.teacherId ?? null
  }

  const user = await prisma.user.create({
    data: {
      firstName: row.firstName,
      lastName: row.lastName,
      username,
      email,
      password: hashedPwd,
      role: 'STUDENT',
      isActive: true,
      phone: row.phone || null,
      address: addressWithPwd,
    },
  })

  await prisma.student.create({
    data: {
      userId: user.id,
      schoolId,
      teacherId: resolvedTeacherId,
      classId: classId || null,

    },
  })

  return { email, password: plainPwd, username }
}

/* ── Bulk Import Orchestrator ── */
export async function importStudents(
  csvText: string,
  schoolId: string,
  teacherId?: string,
  classId?: string | null,
  grade?: string,
): Promise<ImportSummary> {
  const lines = csvText.trim().split('\n').filter((l: string) => l.trim())
  if (lines.length === 0) return { created: 0, skipped: 0, total: 0, results: [] }

  // Detect headers
  const firstLineHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''))
  const hasHeader = firstLineHeaders.some(h =>
    ['firstname','first_name','first','name','student','lastname','surname'].includes(h)
  )

  const rows = parseRows(lines, hasHeader)
  if (rows.length === 0) return { created: 0, skipped: 0, total: 0, results: [] }

  // Resolve class if grade provided
  let resolvedClassId = classId || null
  if (grade && !resolvedClassId) {
    resolvedClassId = await resolveClassId(grade, schoolId, teacherId)
  }

  const results: ImportResult[] = []
  let created = 0, skipped = 0

  for (const row of rows) {
    if (!row.firstName) {
      skipped++
      results.push({ name: row.raw.slice(0, 40), email: '', username: '', password: '', status: 'skipped', reason: 'Missing first name' })
      continue
    }

    try {
      const { email, password, username } = await createStudentUser(row, schoolId, teacherId, resolvedClassId)
      created++
      results.push({ name: `${row.firstName} ${row.lastName}`, email, username, password, status: 'created' })
    } catch (e: unknown) {
      skipped++
      results.push({ name: `${row.firstName} ${row.lastName}`, email: '', username: '', password: '', status: 'skipped', reason: e instanceof Error ? e.message.slice(0, 80) : 'Unknown error' })
    }
  }

  return { created, skipped, total: rows.length, results }
}
