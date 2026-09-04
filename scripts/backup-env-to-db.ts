/**
 * Backup all application environment variables into the database's
 * SystemSettings table.
 *
 * Reads ONLY the project .env file (not the OS environment), so we don't
 * accidentally mirror Windows/system vars. Each non-empty var is stored as a
 * SystemSettings row under the key "env_backup.<VAR_NAME>" in the category
 * "env_backup". Rows are isPublic=false and isEditable=false so they never
 * surface in settings/UI. Real secrets (DB URLs, keys) are skipped outright so
 * they are never mirrored anywhere.
 *
 * Usage:  npm run backup:env
 */

import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Secrets that should NEVER be mirrored (even to the DB) — these are the
// credentials that gate access and render the whole app useless if exposed.
const SKIP = new Set([
  'DATABASE_URL',
  'OLD_DATABASE_URL',
  'NEXTAUTH_SECRET',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_PASSKEY',
  'OPENAI_API_KEY',
  'OPENAI_DALLE_API_KEY',
  'CEREBRAS_API_KEY',
  'DEEPSEEK_API_KEY',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'STABILITY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ZOOM_SDK_SECRET',
  'ZOOM_CLIENT_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'SMTP_PASS',
])

// Parse a simple KEY="value" (or KEY=value) .env file into an object.
function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf-8')
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && value) result[key] = value
  }
  return result
}

async function main() {
  console.log('🔐 Backing up application env vars to SystemSettings…')

  // updatedBy is a required FK to a real User row. Use the first super admin.
  const superAdmin = await prisma.superAdmin.findFirst({
    orderBy: { id: 'asc' },
    select: { userId: true },
  })
  if (!superAdmin) {
    console.error('❌ No super admin user found — cannot set updatedBy FK.')
    process.exit(1)
  }
  const updatedBy = superAdmin.userId

  const envFile = path.join(process.cwd(), '.env')
  const appEnv = readEnvFile(envFile)

  let saved = 0
  let skipped = 0

  for (const [key, value] of Object.entries(appEnv)) {
    if (!value) continue
    if (SKIP.has(key)) {
      skipped++
      continue
    }

    const settingKey = `env_backup.${key}`
    const isSecret = /SECRET|KEY|TOKEN|PASSWORD|PASS|CONSUMER|ANON/i.test(key)

    const data = {
      value,
      type: 'string',
      category: 'env_backup',
      description: `Backup of environment variable ${key}`,
      isPublic: false,
      isEditable: false,
      updatedBy,
    }

    await prisma.systemSettings.upsert({
      where: { key: settingKey },
      update: data,
      create: { key: settingKey, ...data },
    })
    saved++

    if (!isSecret) {
      console.log(`  ✓ ${key}`)
    }
  }

  console.log(
    `\n✅ Saved ${saved} env vars from .env to SystemSettings (${skipped} secrets skipped).`,
  )
  console.log('   Stored as isPublic=false, isEditable=false, category="env_backup".')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
