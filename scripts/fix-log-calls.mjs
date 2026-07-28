import fs from 'fs'

// Fix TS2554 (wrong arg count) and TS2345 (wrong types) in log calls
// These were originally console.log/error with multiple args, now converted to log.info/error

const fixLogCalls = (content) => {
  // Fix log.info/warn with 3+ args → wrap extras into object
  // Pattern: log.info('msg', a, b, c)  →  log.info('msg', { 0: a, 1: b, 2: c })
  // Better: log.info('msg ' + a + ' ' + b + ' ' + c)
  content = content.replace(
    /(log\.(?:info|warn)\s*\([^,]+,\s*)([^;{]+?)(\s*,\s*[^;{]+?){2,}\s*\)/g,
    (match, prefix, first, rest) => {
      // Combine all args into string interpolation
      const args = match.replace(/^log\.(?:info|warn)\(/, '').replace(/\)$/, '').split(',').map(s => s.trim())
      const msg = args[0]
      const extras = args.slice(1).map(a => `\$\{${a}\}`).join(' ')
      return `log.info(${msg} + ' ' + ${extras})`
    }
  )

  // Fix log.info/warn with string/number second arg
  content = content.replace(
    /(log\.(?:info|warn|error)\s*\()([^,]+,\s*)(user\.\w+|teacher\.\w+|classes\.\w+|req\.\w+|body\.\w+)(\))/g,
    (match, prefix, msgArg, extraArg, close) => {
      // Wrap in object: { value: extra }
      return `${prefix}${msgArg}{ value: ${extraArg} }${close}`
    }
  )

  // Fix remaining string/number second args that are bare identifiers
  content = content.replace(
    /(log\.(?:info|warn)\s*\()([^,]+,\s*)([a-z_]\w*\s*)\)/g,
    (match, prefix, msgArg, extraArg) => {
      // Check if extraArg already looks like an object ({...}), if not wrap it
      if (extraArg.trim().startsWith('{')) return match
      return `${prefix}${msgArg}{ value: ${extraArg.trim()} })`
    }
  )

  return content
}

const filesToFix = [
  'src/app/api/ai/images/route.ts',
  'src/app/api/classes/route.ts',
  'src/app/api/rubrics/route.ts',
  'src/app/api/student/route.ts',
  'src/app/api/ai/parse-document/route.ts',
  'src/app/api/ai/presentation/route.ts',
  'src/app/api/ai/presentations/[id]/route.ts',
  'src/app/api/ai/generate-scheme-structured/route.ts',
  'src/app/api/export/powerpoint/route.ts',
  'src/app/api/lesson-plans/share/route.ts',
  'src/app/api/student/ai-lessons/[lessonId]/start/route.ts',
  'src/app/api/student/ai-teacher-insights/route.ts',
  'src/app/api/student/dashboard/route.ts',
  'src/app/api/student/school-info/route.ts',
  'src/app/api/student/messages/route.ts',
  'src/app/api/teacher/analytics/route.ts',
  'src/app/api/teacher/students/route.ts',
  'src/app/api/teacher/dashboard-stats/route.ts',
  'src/app/api/teacher/messages/route.ts',
  'src/app/api/subscription/status/route.ts',
  'src/app/api/presentations/[id]/download/route.ts',
  'src/app/api/teacher/upload-document/route.ts',
]

for (const filePath of filesToFix) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Missing: ${filePath}`)
    continue
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  const fixed = fixLogCalls(content)
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
  } else {
    console.log(`  No change: ${filePath}`)
  }
}
