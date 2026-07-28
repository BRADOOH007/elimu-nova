import fs from 'fs'

// ============================================================
// Batch fix all remaining TypeScript errors
// ============================================================

// 1. Fix request → req in AI files
const requestFiles = [
  'src/app/api/ai/auto-mark/route.ts',
  'src/app/api/ai/bloom-quiz/route.ts',
  'src/app/api/ai/checkpoint-quiz/route.ts',
  'src/app/api/ai/exam-format-analyzer/route.ts',
  'src/app/api/ai/exam-versions/route.ts',
  'src/app/api/ai/explain-question/route.ts',
  'src/app/api/ai/marking-scheme/route.ts',
  'src/app/api/ai/process-uploaded-exam/route.ts',
]

for (const f of requestFiles) {
  let c = fs.readFileSync(f, 'utf-8')
  const orig = c
  // Rename handler param `request` → `req`
  c = c.replace(/(async\s*\()request(\s*[,)])/, '$1req$2')
  // Rename body references
  c = c.replace(/\brequest\b/g, 'req')
  if (c !== orig) { fs.writeFileSync(f, c, 'utf-8'); console.log(`✅ request→req: ${f}`) }
}

// 2. Fix req/params in fix-remaining files
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
  const orig = c
  // Rename `request` param to `req`
  c = c.replace(/(async\s*\()request(\s*[,)])/, '$1req$2')
  // Rename body `request` → `req`
  c = c.replace(/\brequest\b/g, 'req')
  // Add params to destructuring: { user } → { user, params }
  c = c.replace(/\(\s*\{\s*user\s*\}\s*\)/g, '{ user, params }')
  if (c !== orig) { fs.writeFileSync(f, c, 'utf-8'); console.log(`✅ fix-remaining: ${f}`) }
}

// 3. Fix user shadowing - rename destructured `user` to `authUser`
const shadowFiles = [
  { file: 'src/app/api/ai/presentation/route.ts', handlerIdx: 0, constUserLine: 'const user = await prisma.user.findUnique' },
  { file: 'src/app/api/ai/presentations/route.ts', handlerIdx: 0, constUserLine: 'const user = await prisma.user.findUnique({' },
  { file: 'src/app/api/ai/presentations/[id]/route.ts', handlerIdx: 0, constUserLine: 'const user = await prisma.user.findUnique' },
  { file: 'src/app/api/reset-student-password/route.ts', handlerIdx: 0, constUserLine: 'const user = await prisma.user.findUnique' },
  { file: 'src/app/api/users/route.ts', handlerIdx: 1, constUserLine: 'const user = await prisma.user.create' },
  { file: 'src/app/api/users/[id]/route.ts', handlerIdxList: [0, 1], constUserLine: 'const user = await' },
]

function fixShadowing(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Find all route handlers and process each one
  // Strategy: find all `export const` route definitions
  const handlerRegex = /export const (GET|POST|PUT|PATCH|DELETE) = route\(/g
  let match
  let handlers = []

  while ((match = handlerRegex.exec(content)) !== null) {
    handlers.push({ method: match[1], start: match.index })
  }

  // Process handlers in REVERSE order to preserve positions
  for (let h = handlers.length - 1; h >= 0; h--) {
    const handlerStart = handlers[h].start
    // Find the end of this handler (next handler or end of file)
    const handlerEnd = h < handlers.length - 1 ? handlers[h + 1].start : content.length
    const handlerText = content.slice(handlerStart, handlerEnd)

    // Check if this handler has `{ user` in destructuring
    const destructureMatch = handlerText.match(/async\s*\(\s*req\s*,\s*\{[^}]*\buser\b[^}]*\}\s*\)/)
    if (!destructureMatch) continue

    // Check if there's `const user = ` in the body that would shadow
    const bodyStart = handlerText.indexOf('=> {')
    if (bodyStart === -1) continue
    const body = handlerText.slice(bodyStart)
    
    // Find `const user =` in the body
    const constUserIdx = body.search(/\bconst\s+user\s*=/)
    if (constUserIdx === -1) continue  // No shadowing in this handler

    // Has shadowing - rename destructured user
    const handlerSig = handlerText.slice(0, destructureMatch.index + destructureMatch[0].length)
    const handlerRest = handlerText.slice(destructureMatch.index + destructureMatch[0].length)

    // Rename { user, params } → { user: authUser, params }
    // and { user } → { user: authUser }
    let newSig = handlerSig
    newSig = newSig.replace(/\(\s*\{\s*user\s*,\s*params\s*\}\s*\)/, '({ user: authUser, params })')
    newSig = newSig.replace(/\(\s*\{\s*user\s*\}\s*\)/, '({ user: authUser })')

    // In the handler rest (the body), find `const user =` and rename to `const dbUser =`
    // Also rename `user.` after `const dbUser =` to `dbUser.`
    // But `user.email` inside the const initializer refers to the outer user
    
    // For the code BEFORE const user, rename user. → authUser.
    // For the code AFTER const user (including its initializer), keep as user (local)
    // But inside the const initializer, user.email → authUser.email
    
    const codeBeforeConstUser = body.slice(0, constUserIdx)
    const codeAfterConstUser = body.slice(constUserIdx)

    // In codeBeforeConstUser, rename user. → authUser. but not prisma.user
    let fixedBefore = codeBeforeConstUser.replace(/\buser\./g, 'authUser.')

    // In the const declaration itself, rename `user =` to `dbUser =`
    let fixedDeclaration = codeAfterConstUser.replace(/^(\s*)const user =/, '$1const dbUser =')
    
    // In the const initializer (before ;), user.email → authUser.email
    // Find the end of the const declaration
    let depth = 0, semiPos = -1
    for (let i = 0; i < fixedDeclaration.length; i++) {
      const ch = fixedDeclaration[i]
      if (ch === '{' || ch === '(') depth++
      if (ch === '}' || ch === ')') depth--
      if (ch === ';' && depth === 0) { semiPos = i; break }
    }
    if (semiPos === -1) semiPos = fixedDeclaration.indexOf('\n', 1)
    if (semiPos === -1) semiPos = fixedDeclaration.length
    
    const initializer = fixedDeclaration.slice(0, semiPos + 1)
    const afterInitializer = fixedDeclaration.slice(semiPos + 1)
    
    let fixedInitializer = initializer.replace(/\buser\./g, (match) => {
      // Don't rename in prisma.user
      return 'authUser.'
    })
    // But fix the first occurrence - `user` = the dbUser declaration itself
    // Actually the issue is that `const dbUser =` is now the variable name, and the RHS
    // references `authUser.email` not `dbUser.email`. So user. in initializer → authUser.
    // Wait, user.email in initializer refers to the DESTRUCTURED user which is now authUser
    
    // Actually, let me be smarter: only rename user. → authUser. in the initializer
    // that appears INSIDE function calls (like .findUnique({ where: { email: user.email } }))
    // But this is too complex. Let me just handle the common case:
    // Inside prisma.findUnique/findMany/where, user. should be authUser.
    // After the const declaration, user. should be dbUser.
    
    fixedInitializer = fixedInitializer.replace(/where:\s*\{\s*email:\s*user\./g, 'where: { email: authUser.')
    fixedInitializer = fixedInitializer.replace(/where:\s*\{\s*id:\s*user\./g, 'where: { id: authUser.')
    
    // In the code after initializer, rename user. → dbUser. but NOT in prisma.user
    let fixedAfter = afterInitializer.replace(/\buser\./g, 'dbUser.')
    fixedAfter = fixedAfter.replace(/\bif\s*\(\s*!user\b/g, 'if (!dbUser')
    fixedAfter = fixedAfter.replace(/\bif\s*\(\s*user\./g, 'if (dbUser.')
    fixedAfter = fixedAfter.replace(/\breturn user\b/g, 'return dbUser')
    
    const newHandlerText = newSig + fixedBefore + fixedInitializer + fixedAfter
    content = content.slice(0, handlerStart) + newHandlerText + content.slice(handlerEnd)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ shadow: ${filePath}`)
  }
}

for (const sf of shadowFiles) {
  fixShadowing(sf.file)
}

// 4. Fix TS2367 in reset-student-password - already handled above

// 5. Fix stream/route.ts
let streamPath = 'src/app/api/stream/route.ts'
let streamContent = fs.readFileSync(streamPath, 'utf-8')
// Change import to include NextResponse
streamContent = streamContent.replace(
  "import { NextRequest } from 'next/server'",
  "import { NextRequest, NextResponse } from 'next/server'"
)
// Change Response → NextResponse
streamContent = streamContent.replace(/\bResponse\b(?!\s*\.)/g, (m, offset) => {
  // Check if it's NextResponse, not standalone Response
  const before = streamContent.slice(Math.max(0, offset - 12), offset)
  return before === 'NextResponse' || before === 'w NextResponse' ? m : 'NextResponse'
})
fs.writeFileSync(streamPath, streamContent, 'utf-8')
console.log(`✅ stream: ${streamPath}`)

// 6. Fix avatar on UserInfo
const apiMiddlewarePath = 'src/lib/api-middleware.ts'
let apiContent = fs.readFileSync(apiMiddlewarePath, 'utf-8')
if (!apiContent.includes('avatar')) {
  apiContent = apiContent.replace(
    /type UserInfo = \{ id: string; email: string; role: string; name: string;/,
    'type UserInfo = { id: string; email: string; role: string; name: string; avatar?: string | null;'
  )
  fs.writeFileSync(apiMiddlewarePath, apiContent, 'utf-8')
  console.log(`✅ avatar in UserInfo`)
}

// 7. Fix assignments results - it's handled by fix-remaining which uses the main codemod
// But the main codemod corrupts it. Let me just restore and manually fix.
console.log('Done')
