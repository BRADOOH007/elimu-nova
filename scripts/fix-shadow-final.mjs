import fs from 'fs'

// Simple targeted fix for user shadowing:
// 1. Rename destructured `user` to `authUser` in handler signature
// 2. Rename `user.` before `const user =` to `authUser.`
// 3. Keep `const user` as-is (local variable)

const files = [
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/reset-student-password/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
]

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Process each handler that has both `{ user }` destructuring AND `const user =` body
  // Find all handlers
  const handlerRegex = /export const (GET|POST|PUT|PATCH|DELETE) = route\([^)]+,\s*async\s*\(req,\s*\{[^}]*\}\s*\)\s*=>\s*\{/g
  let match
  
  while ((match = handlerRegex.exec(content)) !== null) {
    const handlerEnd = match.index + match[0].length
    const handlerSig = match[0]
    
    // Check if this handler destructures `user`
    if (!handlerSig.includes(' user,') && !handlerSig.includes(' user}') && !handlerSig.includes('{user')) continue
    
    // Find if there's `const user =` in this handler
    // Find the end of this handler (simple approach: find matching brace)
    let depth = 1
    let i = handlerEnd
    while (i < content.length && depth > 0) {
      if (content[i] === '{') depth++
      if (content[i] === '}') depth--
      i++
    }
    const handlerBodyEnd = i - 1
    const body = content.slice(handlerEnd, handlerBodyEnd)
    
    // Check for `const user =` in body
    if (!body.includes('const user =')) continue
    
    const constUserIdxInBody = body.indexOf('const user =')
    const bodyBeforeConstUser = body.slice(0, constUserIdxInBody)
    
    // Count user. references before const user
    const userDotMatches = bodyBeforeConstUser.match(/\buser\./g)
    if (!userDotMatches) continue
    
    // This handler needs fixing
    
    // Step 1: Rename destructured user to authUser
    let newSig = handlerSig
    newSig = newSig.replace(
      /(\{)([^}]*?)\buser\b([^}]*?\})/,
      (_, open, before, after) => {
        // Remove "user" from the destructuring, insert "user: authUser"
        // before becomes " user," if present, then replace " user" with " user: authUser"
        const trimmed = (before + 'user' + after)
          .replace(/\buser\b/, 'user: authUser')
        return open + trimmed
      }
    )
    
    // Simpler: just replace the exact pattern
    newSig = handlerSig.replace('{ user, params }', '{ user: authUser, params }')
    newSig = newSig.replace('{ user, params', '{ user: authUser, params')
    newSig = newSig.replace(' user, params }', ' user: authUser, params }')
    newSig = newSig.replace('{ user }', '{ user: authUser }')
    
    // Step 2: Rename user. to authUser. in body before const user
    const newBodyBeforeConstUser = bodyBeforeConstUser.replace(/\buser\./g, 'authUser.')
    
    // Step 3: In the const user initializer, user.email etc should be authUser.email
    const constUserStmt = body.slice(constUserIdxInBody)
    let fixedConstUser = constUserStmt
    
    // Only rename user. inside the init expression (before the closing of the await call)
    // We need to find the end of the const declaration
    let stmtDepth = 0
    let stmtEnd = 0
    for (let j = 0; j < fixedConstUser.length; j++) {
      if (fixedConstUser[j] === '{' || fixedConstUser[j] === '(') stmtDepth++
      if (fixedConstUser[j] === '}' || fixedConstUser[j] === ')') stmtDepth--
      if (fixedConstUser[j] === ';' && stmtDepth === 0) { stmtEnd = j + 1; break }
    }
    if (stmtEnd === 0) { stmtEnd = fixedConstUser.indexOf('\n', 10); if (stmtEnd === -1) stmtEnd = fixedConstUser.length }
    
    const initExpr = fixedConstUser.slice(0, stmtEnd)
    const afterInit = fixedConstUser.slice(stmtEnd)
    
    // In the init expression, rename user. → authUser. (these reference the destructured user)
    let fixedInitExpr = initExpr.replace(/\buser\./g, 'authUser.')
    
    // In code after init, rename user. → dbUser. (these reference the local const user)
    let fixedAfter = afterInit.replace(/\buser\./g, 'dbUser.')
    fixedAfter = fixedAfter.replace(/\bif\s*\(\s*!user\b/g, 'if (!dbUser')
    fixedAfter = fixedAfter.replace(/\bif\s*\(\s*user\./g, 'if (dbUser.')
    fixedAfter = fixedAfter.replace(/\breturn user\b/g, 'return dbUser')
    
    // Also fix standalone user: (in objects)
    fixedAfter = fixedAfter.replace(/\buser\s*:/g, 'dbUser:')
    fixedAfter = fixedAfter.replace(/:\s*user\b/g, ': dbUser')
    fixedAfter = fixedAfter.replace(/\(\s*user\s*\)/g, '(dbUser)')
    
    const newBody = newBodyBeforeConstUser + fixedInitExpr + fixedAfter
    
    content = content.slice(0, match.index) + newSig + newBody + content.slice(handlerBodyEnd)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
  } else {
    console.log(`  No change: ${filePath}`)
  }
}
