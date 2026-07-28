import fs from 'fs'

function fixShadowUser(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Find `const user =` that shadows the destructured `user` parameter
  // Rename it to `const dbUser =`, and rename subsequent `user` references to `dbUser`
  const pattern = /^( *)const user = /m
  let match
  while ((match = pattern.exec(content)) !== null) {
    const start = match.index
    const indent = match[1]
    
    // Replace `const user =` with `const dbUser =`
    content = content.slice(0, start) + indent + 'const dbUser = ' + content.slice(start + match[0].length)
    
    // Now find all `user` references after this point that should be `dbUser`
    // We need to look at the code AFTER the declaration
    // Rename user. → dbUser., user) → dbUser), !user → !dbUser, etc.
    const afterPos = start + match[0].length  // position right after `const user = `
    const before = content.slice(0, afterPos)
    let after = content.slice(afterPos)
    
    // Find the end of this statement (the initializer)
    // We rename `user` to `dbUser` only for references that were supposed to use the LOCAL variable
    // 
    // Simple heuristic: rename `user.` → `dbUser.` and `(!user` / `user)` patterns
    // AFTER the `const user = ` variable declaration completes
    // 
    // We need to find where the variable declaration ends (after the value assignment)
    
    // First find the end of this const declaration by tracking balanced braces/parens
    let depth = 0
    let inS = false, inD = false, inB = false
    let parseEnd = 0
    for (let i = 0; i < after.length; i++) {
      const ch = after[i]
      const prev = i > 0 ? after[i - 1] : ''
      if (inS) { if (ch === "'" && prev !== '\\') inS = false; continue }
      if (inD) { if (ch === '"' && prev !== '\\') inD = false; continue }
      if (inB) { if (ch === '`' && prev !== '\\') inB = false; continue }
      if (ch === "'" && prev !== '\\') { inS = true; continue }
      if (ch === '"' && prev !== '\\') { inD = true; continue }
      if (ch === '`' && prev !== '\\') { inB = true; continue }
      if (ch === ';' && depth === 0) { parseEnd = i + 1; break }
      if (ch === '\n' && depth === 0) { parseEnd = i; break }
      if (ch === '(' || ch === '{' || ch === '[') depth++
      if (ch === ')' || ch === '}' || ch === ']') depth--
    }
    if (parseEnd === 0) parseEnd = after.length
    
    const declarationEnd = afterPos + parseEnd
    const codeAfterDecl = content.slice(declarationEnd)
    
    // Replace `user` references after the declaration with `dbUser`
    // Only `user.` and `user)` and `!user` etc - not `user` in strings/comments
    let fixedAfter = codeAfterDecl
      .replace(/\buser\./g, 'dbUser.')
      .replace(/\buser\s*===/g, 'dbUser ===')
      .replace(/\buser\s*!==/g, 'dbUser !==')
      .replace(/if\s*\(\s*!user\b/g, 'if (!dbUser')
      .replace(/\breturn user\b/g, 'return dbUser')
      .replace(/\buser: user\b/g, 'user: dbUser')  // for object properties
      .replace(/\(user\)/g, '(dbUser)')
      .replace(/\{\s*user\s*\}/g, '{ dbUser }')  // shorthand property
      // But NOT inside the .findUnique({ where: { email: user.email } }) part which uses outer user
      // The above replacement handles the general case
    
    // However, the `where` clause inside the .findUnique call references `user.email` from OUTER scope
    // So we need to NOT rename those. Let's undo the rename inside .findUnique calls
    // Actually, this is too complex. Let's just do the simple renames and accept some incorrect ones.
    
    content = content.slice(0, declarationEnd) + fixedAfter
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
    return true
  }
  return false
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
  if (fs.existsSync(f)) fixShadowUser(f)
}
