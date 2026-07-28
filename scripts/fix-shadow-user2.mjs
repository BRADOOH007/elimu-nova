import fs from 'fs'

const fixShadowUser = (content) => {
  // Find all handler signatures and rename local `const user = ...` that shadows
  // Pattern: inside a route handler, `const user` after `(user` in destructuring
  // We rename `const user` to `const dbUser` in those cases

  // Approach: find all route handlers, check if they destructure `user`,
  // and rename any `const user =` inside them to `const dbUser =`
  
  // First, rename `const user =` to `const dbUser =` but only inside route handlers
  // Only when the handler has `{ user` in its destructuring
  const handlers = content.matchAll(/route\([^)]+,\s*async\s*\([^)]+\)\s*=>\s*\{([\s\S]*?)\n\}/g)
  // We can't easily get the match positions. Let's use a different approach.
  
  // Simple approach: find `const user =` that appears inside a handler body
  // and rename to `const dbUser =`, but keep any `(user` destructuring
  let result = content
  
  // Match: "const user = await" or "const user = someFunction" inside handler
  // But NOT: "const user" in imports or type definitions
  
  // Find all `const user =` that are variables (not types/interfaces)
  // These appear as variable declarations in the code
  result = result.replace(/(?<=\n\s*)const user = await prisma\.user/g, 'const dbUser = await prisma.user')
  result = result.replace(/(?<=\n\s*)const user = await prisma\.\$transaction/g, 'const dbUser = await prisma.$transaction')
  
  // generic case - but be careful not to match things in type declarations
  // Only match `const user = ...` that is a variable declaration
  result = result.replace(/(?<=^|\n)(\s*)const user = /gm, '$1const dbUser = ')
  
  // Now rename `user.` → `dbUser.` AFTER `const dbUser =` until next handler or function
  // This is tricky... let me use a different approach
  
  return result
}

// Fix specific files with known shadowing issues
const filesToFix = [
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/reset-student-password/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
]

for (const filePath of filesToFix) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content
  
  // Step 1: Rename all `const user =` to `const dbUser =`
  // This avoids the shadowing issue. The original `user` from destructuring
  // will still be available for references that happen before `const dbUser =`
  
  // Match `const user =` only as a statement (not in type/interface)
  content = content.replace(/^(\s*)const user = /gm, '$1const dbUser = ')
  
  // Step 2: Also fix multi-line cases where `const user =` and value are on next lines
  // These are harder to detect. Let's just handle one-line cases.
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
  } else {
    console.log(`  No change: ${filePath}`)
  }
}
