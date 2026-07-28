import fs from 'fs'

const files = [
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/reset-student-password/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/users/route.ts',
]

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Find the position of the handler signature and the first `const user =` declaration
  const handlerMatch = content.match(/async\s*\(req,\s*\{\s*user[\s,}]/)
  const constUserMatch = content.match(/\bconst user = await prisma\.user\./)

  if (handlerMatch && constUserMatch) {
    const handlerEnd = handlerMatch.index + handlerMatch[0].length
    const constUserStart = constUserMatch.index

    // Split: before const user (uses destructured user) and after (uses DB user)
    const beforeConst = content.slice(0, constUserStart)
    const afterConst = content.slice(constUserStart)

    // Rename destructured user -> authUser in handler signature
    let modified = beforeConst.replace(
      /(async\s*\(req,\s*\{\s*)user(\s*[\s,}])/,
      '$1user: authUser$2'
    )

    // Rename user. -> authUser. in the part before const user
    // But only if user. appears (not const user)
    modified = modified.replace(/\buser\./g, 'authUser.')

    // Reassemble
    content = modified + afterConst
  }

  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✅ Fixed: ${filePath}`)
}
