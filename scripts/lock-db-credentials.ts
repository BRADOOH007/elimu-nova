import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  const content = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = parseEnvFile(join(root, '.env'))
const oldBackup = parseEnvFile(join(root, 'scripts', 'backup-connection.env'))

const mainUrl = env.DATABASE_URL || oldBackup.DATABASE_URL || ''
const backupUrl = oldBackup.BACKUP_DATABASE_URL || ''

if (!mainUrl) {
  console.error('ERROR: could not find DATABASE_URL')
  process.exit(1)
}

const lines = [
  '# =====================================================================',
  '# ElimuNova - DATABASE CREDENTIALS (LOCKED IN - DO NOT LOSE)',
  '# =====================================================================',
  '# Two Neon PostgreSQL databases. Connection strings include the password.',
  '#   DATABASE_URL        = PRIMARY  (ep-steep-feather-ahzjj8zt) - local dev + production',
  '#   BACKUP_DATABASE_URL = BACKUP   (ep-autumn-butterfly-atjcx6be)',
  '#',
  '# This file is GITIGNORED - it will never be committed or pushed to GitHub.',
  '# Store a copy in your password manager as well.',
  '# =====================================================================',
  '',
  'DATABASE_URL=' + mainUrl,
]
if (backupUrl) lines.push('BACKUP_DATABASE_URL=' + backupUrl)
lines.push('')

const outPath = join(root, 'scripts', 'DATABASE_CREDENTIALS.backup.env')
writeFileSync(outPath, lines.join('\n'), 'utf8')

// Verify
const verify = parseEnvFile(outPath)
const okMain = verify.DATABASE_URL?.includes('ep-steep-feather-ahzjj8zt') === true
const okBackup = backupUrl ? verify.BACKUP_DATABASE_URL?.includes('ep-autumn-butterfly-atjcx6be') === true : true

console.log('Wrote:', outPath)
console.log('DATABASE_URL present & correct host:', okMain)
console.log('BACKUP_DATABASE_URL present & correct host:', okBackup)
console.log('Total lines:', lines.length)
