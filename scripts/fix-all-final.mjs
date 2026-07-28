import fs from 'fs'
import path from 'path'

// ============================================================
// FINAL BATCH: Fix all remaining TypeScript errors at once
// ============================================================

// 1. Fix request → req in 8 AI files
console.log('=== Fix 1: request → req ===')
const aiRequestFiles = [
  'src/app/api/ai/auto-mark/route.ts',
  'src/app/api/ai/bloom-quiz/route.ts',
  'src/app/api/ai/checkpoint-quiz/route.ts',
  'src/app/api/ai/exam-format-analyzer/route.ts',
  'src/app/api/ai/exam-versions/route.ts',
  'src/app/api/ai/explain-question/route.ts',
  'src/app/api/ai/marking-scheme/route.ts',
  'src/app/api/ai/process-uploaded-exam/route.ts',
]
for (const f of aiRequestFiles) {
  let c = fs.readFileSync(f, 'utf-8')
  c = c.replace(/\brequest\b(?!\.json|\.url|\.method|\.headers)/g, 'req')
  // Also fix handler param
  c = c.replace(/async\s*\(\s*req\s*,/g, 'async (req,')
  fs.writeFileSync(f, c, 'utf-8')
  console.log(`  ${path.basename(path.dirname(f))}/${path.basename(f)}`)
}

// 2. Fix req/params in fix-remaining files
console.log('=== Fix 2: req/params ===')
const fixRemainingFiles = [
  'src/app/api/ai/generate-content/route.ts',
  'src/app/api/assignments/route.ts',
  'src/app/api/courses/route.ts',
  'src/app/api/powerpoint/[id]/route.ts',
  'src/app/api/schemes-of-work/[id]/topics/[topicId]/route.ts',
  'src/app/api/teacher/students/route.ts',
]
for (const f of fixRemainingFiles) {
  let c = fs.readFileSync(f, 'utf-8')
  // Fix handler param: request → req  
  c = c.replace(/async\s*\(\s*request\s*,/g, 'async (req,')
  // Fix body references: request → req (but not in import strings)
  c = c.replace(/(?<!['"])request\./g, 'req.')
  c = c.replace(/(?<!['"])request\(/g, 'req(')
  // Fix destructuring: add params
  c = c.replace(/\(\s*\{\s*user\s*\}\s*\)/g, '{ user, params }')
  c = c.replace(/\(\s*\{\s*user\s*,\s*params\s*\}\s*\)/g, '{ user, params }')
  fs.writeFileSync(f, c, 'utf-8')
  console.log(`  ${path.basename(path.dirname(f))}/${path.basename(f)}`)
}

// 3. Fix user shadowing: rename destructured user → authUser
console.log('=== Fix 3: User shadowing ===')
const shadowFiles = [
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/reset-student-password/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
]

function fixUserShadowing(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Process each export const XXX = route(...) handler
  // Find: "async (req, { user, params }) => {" or similar
  // Replace with: "async (req, { user: authUser, params }) => {"
  
  // Method: find all route handler signatures with `{ user` destructuring
  // and rename user to user: authUser in each
  
  let lines = content.split('\n')
  let inHandler = false
  let handlerEndBraceDepth = 0
  let handlerStartLine = -1
  let hasUserDestructure = false
  let hasConstUser = false
  let constUserLine = -1
  
  const result = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect handler start
    if (!inHandler && line.match(/export const (GET|POST|PUT|PATCH|DELETE) = route\(/)) {
      inHandler = true
      handlerStartLine = i
      hasUserDestructure = false
      hasConstUser = false
      constUserLine = -1
      handlerEndBraceDepth = 0
    }
    
    if (inHandler) {
      // Count braces to find handler end
      for (const ch of line) {
        if (ch === '{') handlerEndBraceDepth++
        if (ch === '}') handlerEndBraceDepth--
      }
      
      // Check for destructured user in signature
      if (line.includes('{ user,') || line.includes('{ user}') || line.includes(',user')) {
        hasUserDestructure = true
      }
      
      // Check for const user = (shadowing)
      if (line.match(/^\s*const user = /) || line.match(/^\s*const\s+user\s*=\s*await\s/)) {
        hasConstUser = true
        constUserLine = i
      }
      
      // Handler end
      if (handlerEndBraceDepth <= 0 && i > handlerStartLine + 1) {
        // Handler ended, check if we need to fix
        if (hasUserDestructure && hasConstUser) {
          // Fix lines from handlerStartLine to constUserLine
          // Rename destructured user → authUser
          for (let j = handlerStartLine; j <= constUserLine; j++) {
            // In the handler signature line, change `{ user,` to `{ user: authUser,`
            if (j === handlerStartLine) {
              result[j] = result[j] || lines[j]
              result[j] = result[j].replace(/\{\s*user\s*,/g, '{ user: authUser,')
              result[j] = result[j].replace(/\{\s*user\s*\}/g, '{ user: authUser }')
            }
            // In body lines BEFORE const user, rename user. → authUser.
            if (j > handlerStartLine && j < constUserLine) {
              result[j] = result[j] || lines[j]
              result[j] = result[j].replace(/\buser\./g, 'authUser.')
            }
          }
        }
        inHandler = false
      }
    }
    
    if (!result[i]) result[i] = lines[i]
  }

  content = result.join('\n')
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`  ${path.basename(filePath)}`)
  }
}

for (const f of shadowFiles) {
  fixUserShadowing(f)
}

// 4. Fix stream/route.ts - Response → NextResponse
console.log('=== Fix 4: stream/route.ts ===')
let streamContent = fs.readFileSync('src/app/api/stream/route.ts', 'utf-8')
streamContent = streamContent.replace(
  /import { NextRequest } from 'next-server'/,
  "import { NextRequest, NextResponse } from 'next/server'"
)
streamContent = streamContent.replace(
  /import { NextRequest } from 'next\/server'/,
  "import { NextRequest, NextResponse } from 'next/server'"
)
// Replace return type Promise<Response> → Promise<NextResponse>
streamContent = streamContent.replace(/: Promise<Response>/g, ': Promise<NextResponse>')
fs.writeFileSync('src/app/api/stream/route.ts', streamContent, 'utf-8')
console.log('  stream/route.ts')

// 5. Fix teacher/parents/route.ts - parents not found
console.log('=== Fix 5: teacher/parents ===')
let parentsContent = fs.readFileSync('src/app/api/teacher/parents/route.ts', 'utf-8')
// The file still has the original code from backup. The codemod corrupted it.
// But after the last restore + codemod run, it might be in the corrupted state.
// Let me check and fix if needed.
if (parentsContent.includes('parents.map') && !parentsContent.includes('const parents')) {
  // The codemod corrupted this file - need to restore and manually convert
  const bakPath = 'src/app/api/teacher/parents/route.ts.codemod.bak'
  if (fs.existsSync(bakPath)) {
    const bak = fs.readFileSync(bakPath, 'utf-8')
    // Manually apply the codemod transform
    let fixed = bak
    // Replace signature
    fixed = fixed.replace(
      /export async function GET\(req: NextRequest\)/,
      "export const GET = route({ auth: ['TEACHER'] }, async (req, { user, params })"
    )
    // Remove getServerSession
    fixed = fixed.replace(/const session = await getServerSession\(authOptions\);\s*\n?/g, '')
    // Remove !session checks
    fixed = fixed.replace(/if \(!session\) \{\s*[\s\S]*?return NextResponse\.json\([\s\S]*?\)[\s;]*\n\s*\}\s*\n?/g, '')
    // Replace session.user references
    fixed = fixed.replace(/session\.user\.role/g, 'user.role')
    fixed = fixed.replace(/session\.user\.id/g, 'user.id')
    fixed = fixed.replace(/session\.user/g, 'user')
    // Replace console.log/error with log.info/error
    fixed = fixed.replace(/console\.log\(/g, 'log.info(')
    fixed = fixed.replace(/console\.error\(/g, 'log.error(')
    // Add imports
    fixed = "import { NextRequest, NextResponse } from 'next/server'\nimport { prisma } from '@/lib/prisma'\n\nimport { route, apiLogger } from '@/lib/api-middleware'\nconst log = apiLogger('teacher/parents')\n\n" + fixed
    // Fix closing braces (original function had } at end, needs }))
    fixed = fixed.trim()
    if (fixed.endsWith('}')) fixed = fixed.slice(0, -1) + '})'
    fs.writeFileSync('src/app/api/teacher/parents/route.ts', fixed, 'utf-8')
    console.log('  teacher/parents/route.ts (rebuilt from backup)')
  }
}

// 6. Fix avatar in UserInfo
console.log('=== Fix 6: UserInfo avatar ===')
let apiContent = fs.readFileSync('src/lib/api-middleware.ts', 'utf-8')
if (!apiContent.includes('avatar')) {
  apiContent = apiContent.replace(
    /type UserInfo = \{ id: string; email: string; role: string; name: string;/,
    'type UserInfo = { id: string; email: string; role: string; name: string; avatar?: string | null;'
  )
  fs.writeFileSync('src/lib/api-middleware.ts', apiContent, 'utf-8')
  console.log('  added avatar to UserInfo')
}

console.log('\nDone!')
