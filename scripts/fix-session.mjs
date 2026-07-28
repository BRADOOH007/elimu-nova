import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../src/app/api')

const filesToFix = [
  'activities/[id]/route.ts',
  'ai/alexa-chat/route.ts',
  'ai/generate-simple-presentation/route.ts',
  'ai/parse-document/route.ts',
  'assignments/[id]/route.ts',
  'assignments/[id]/submit/route.ts',
  'assignments/route.ts',
  'billing/convert-to-usd/route.ts',
  'billing/mpesa/status/route.ts',
  'classes/route.ts',
  'courses/[id]/enroll/route.ts',
  'courses/[id]/route.ts',
  'curriculum/auto-populate/route.ts',
  'curriculum/strands/route.ts',
  'curriculum/subjects/route.ts',
  'curriculum/substrands/route.ts',
  'curriculums/[id]/route.ts',
  'curriculums/route.ts',
  'exam-sessions/[id]/reentry/route.ts',
  'exam-sessions/[id]/violations/route.ts',
  'exam-sessions/route.ts',
  'invoices/[id]/route.ts',
  'invoices/route.ts',
  'lesson-plans/[id]/route.ts',
  'messages/route.ts',
  'payment-methods/[id]/route.ts',
  'payment-methods/route.ts',
  'rubrics/route.ts',
  'schemes-of-work/[id]/route.ts',
  'school-admin/classes/[id]/route.ts',
  'school-admin/reports/[id]/route.ts',
  'school-admin/reports/route.ts',
  'student/ai-teacher-insights/route.ts',
  'student/ai-tutor/route.ts',
  'student/assignments/route.ts',
  'student/dashboard/route.ts',
  'student/lesson-plans/route.ts',
  'student/route.ts',
  'student/study-sessions/route.ts',
  'student/upload/route.ts',
  'super-admin/mpesa-config/route.ts',
  'super-admin/safety-log/route.ts',
  'system-settings/route.ts',
  'teacher/assignments/reports/route.ts',
  'teacher/classes/[id]/route.ts',
  'teacher/classes/share-lesson-plans/route.ts',
  'teacher/lesson-plans/[id]/share/route.ts',
  'teacher/notifications/route.ts',
  'teacher/school-info/route.ts',
  'teacher/student-progress/route.ts',
  'teacher/students/[id]/credentials/route.ts',
  'teacher/students/[id]/password/route.ts',
  'teacher/upload-document/route.ts',
  'zoom/config/route.ts',
]

let totalChanged = 0

for (const relPath of filesToFix) {
  const filePath = path.resolve(API_DIR, relPath)
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relPath}`)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Step 1: Remove one-liner `if (!session) return NextResponse.json(...)`
  // Uses line-based matching (start of line to end of line) to avoid over-eating
  content = content.replace(
    /^\s*if\s*\(\s*!session\s*\)\s*return\s+NextResponse\.json\(.*\)\s*$/gm,
    ''
  )

  // Step 2: Remove `!session || ` from compound conditions (with word boundary)
  content = content.replace(
    /!session\b\s*\|\|/g,
    ''
  )

  // Step 3: Replace `!!session` with `true` (with word boundary)
  content = content.replace(
    /!!session\b/g,
    'true'
  )

  // Step 4: Replace remaining `if (!session)` with `if (false)`
  // These are the brace-block form: if (!session) { ... }
  content = content.replace(
    /if\s*\(\s*!session\b\s*\)/g,
    'if (false)'
  )

  // Step 5: Replace canAccessCourse(session, ...) with canAccessCourse({ user }, ...)
  content = content.replace(
    /\bcanAccessCourse\(\s*session\s*,/g,
    'canAccessCourse({ user },'
  )

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    totalChanged++
    console.log(`✅ Fixed: ${relPath}`)
  }
}

console.log(`\nFixed ${totalChanged} files`)
