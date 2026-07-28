import fs from 'fs'
import path from 'path'

// Fix user shadowing properly:
// For each handler that destructures `user`, find `const user =` inside the body
// and rename it AND all subsequent `user.` references to `dbUser`

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Find all route handlers: route({...}, async (req, { ... }) => {
  const handlerRegex = /route\s*\([^)]+\)\s*,\s*async\s*\(req,\s*\{[^}]*\}\s*\)\s*=>\s*\{/g
  let match
  
  while ((match = handlerRegex.exec(content)) !== null) {
    const handlerStart = match.index
    const handlerPrefix = match[0]
    
    // Check if this handler destructures `user` 
    if (!handlerPrefix.includes('{ user') && !handlerPrefix.includes(',user')) continue
    
    // Find the matching closing brace of this handler
    let depth = 0
    let i = handlerStart
    let inS = false, inD = false, inB = false
    let foundConstUser = false
    let constUserPos = -1
    
    // First pass: find if there's a `const user = ` in this handler
    const handlerText = content.slice(handlerStart)
    let searchPos = handlerPrefix.length
    
    // Simple brace matching to find the handler body
    let braceDepth = 0
    let bodyStart = -1
    for (let j = handlerStart; j < content.length; j++) {
      const ch = content[j]
      const prev = j > 0 ? content[j - 1] : ''
      
      if (inS) { if (ch === "'" && prev !== '\\') inS = false; continue }
      if (inD) { if (ch === '"' && prev !== '\\') inD = false; continue }
      if (inB) { if (ch === '`' && prev !== '\\') inB = false; continue }
      
      if (ch === "'" && prev !== '\\') { inS = true; continue }
      if (ch === '"' && prev !== '\\') { inD = true; continue }
      if (ch === '`' && prev !== '\\') { inB = true; continue }
      
      if (ch === '{') {
        if (bodyStart === -1 && j > match.index + match[0].length - 1) {
          // Skip the opening brace of the handler body
          bodyStart = j
          braceDepth = 1
          continue
        }
        if (bodyStart !== -1) braceDepth++
      }
      if (ch === '}') {
        if (bodyStart !== -1) braceDepth--
        if (bodyStart !== -1 && braceDepth === 0) {
          // End of handler
          const handlerEnd = j
          const body = content.slice(bodyStart + 1, handlerEnd)
          
          // Find `const user = ` in the body
          const userMatch = body.match(/^(\s*)const user = /m)
          if (userMatch) {
            const localUserPos = bodyStart + 1 + userMatch.index
            
            // Before this point, `user` refers to destructured user (keep as-is)
            // After this point, rename `user` → `dbUser`
            const beforeConstUser = content.slice(0, localUserPos)
            const afterConstUser = content.slice(localUserPos)
            
            // Rename `const user` to `const dbUser`
            let fixedAfter = afterConstUser.replace(/^(\s*)const user = /, '$1const dbUser = ')
            
            // Rename all subsequent `user.` → `dbUser.` (but not `const dbUser`)
            fixedAfter = fixedAfter.replace(/\buser\./g, 'dbUser.')
            // Also rename `if (!user)` → `if (!dbUser)`, `if (user.role)` → `if (dbUser.role)` etc.
            fixedAfter = fixedAfter.replace(/\bif\s*\(\s*!user\b/g, 'if (!dbUser')
            fixedAfter = fixedAfter.replace(/\bif\s*\(\s*user\./g, 'if (dbUser.')
            fixedAfter = fixedAfter.replace(/return\s+user\b/g, 'return dbUser')
            fixedAfter = fixedAfter.replace(/:\s*user\b/g, ': dbUser')
            
            content = beforeConstUser + fixedAfter
          }
          
          break
        }
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
  } else {
    console.log(`  No change: ${filePath}`)
  }
}

const files = [
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/reset-student-password/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
]

for (const f of files) {
  if (fs.existsSync(f)) fixFile(f)
  else console.log(`⚠️  Missing: ${f}`)
}
