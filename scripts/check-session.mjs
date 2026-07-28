import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = path.resolve(__dirname, '..')

// Run tsc and get session errors (tsc exits with non-zero, output is in stdout)
let output = ''
try {
  output = execSync('npx tsc --noEmit', { cwd: PROJECT_DIR, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
} catch (e) {
  output = e.stdout || ''
}

// Parse session errors: file(line,col): error TS2304: Cannot find name 'session'
const sessionErrors = []
for (const line of output.split('\n')) {
  const match = line.match(/^(.+\.ts)\((\d+),\d+\): error TS2304: Cannot find name 'session'/)
  if (match) {
    sessionErrors.push({ file: match[1], line: parseInt(match[2]) })
  }
}

console.log(`Found ${sessionErrors.length} session errors`)

// Group by file
const byFile = {}
for (const e of sessionErrors) {
  if (!byFile[e.file]) byFile[e.file] = []
  byFile[e.file].push(e.line)
}

// For each file with session errors, show the session-related lines
for (const [file, lines] of Object.entries(byFile)) {
  const content = fs.readFileSync(file, 'utf-8').split('\n')
  console.log(`\n=== ${path.relative(PROJECT_DIR, file)} ===`)
  for (const lineNum of lines) {
    const idx = lineNum - 1
    if (idx >= 0 && idx < content.length) {
      console.log(`  Line ${lineNum}: ${content[idx].trim()}`)
    }
  }
}

// Summary of unique patterns
console.log('\n=== Session usage patterns ===')
const patterns = {}
for (const [file, lines] of Object.entries(byFile)) {
  const content = fs.readFileSync(file, 'utf-8').split('\n')
  for (const lineNum of lines) {
    const idx = lineNum - 1
    if (idx >= 0 && idx < content.length) {
      const trimmed = content[idx].trim()
      const key = trimmed.replace(/\s+/g, ' ').substring(0, 80)
      patterns[key] = (patterns[key] || 0) + 1
    }
  }
}
for (const [pattern, count] of Object.entries(patterns).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count}x: ${pattern}`)
}
