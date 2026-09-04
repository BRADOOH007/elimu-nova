import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Mirror of src/lib/supabase.ts BUCKETS
const BUCKETS: Record<string, { public: boolean; allowedMimeTypes?: string[]; fileSizeLimit?: number }> = {
  'ai-images': { public: true, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'], fileSizeLimit: 10485760 },
  'lesson-plans': { public: true, allowedMimeTypes: ['application/pdf'], fileSizeLimit: 52428800 },
  'schemes-of-work': { public: true, allowedMimeTypes: ['application/pdf'], fileSizeLimit: 52428800 },
  'presentations': { public: true, allowedMimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'], fileSizeLimit: 52428800 },
  'avatars': { public: true, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'], fileSizeLimit: 5242880 },
  'videos': { public: true, allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'], fileSizeLimit: 52428800 },
  'teacher-documents': { public: true, allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'], fileSizeLimit: 52428800 },
  'student-submissions': { public: false, allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], fileSizeLimit: 52428800 },
}

async function main() {
  if (!url || !service) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: existing, error: listErr } = await admin.storage.listBuckets()
  if (listErr) {
    console.error('Could not list buckets:', listErr.message || listErr)
    process.exit(1)
  }
  const existingNames = new Set((existing || []).map((b) => b.name))
  console.log('Existing buckets:', [...existingNames].join(', ') || '(none)')

  for (const [name, opts] of Object.entries(BUCKETS)) {
    if (existingNames.has(name)) {
      console.log(`  = ${name} (already exists)`)
      continue
    }
    const { error } = await admin.storage.createBucket(name, {
      public: opts.public,
      ...(opts.allowedMimeTypes ? { allowedMimeTypes: opts.allowedMimeTypes } : {}),
      ...(opts.fileSizeLimit ? { fileSizeLimit: opts.fileSizeLimit } : {}),
    })
    if (error) {
      console.error(`  ✗ ${name}: ${error.message || error}`)
    } else {
      console.log(`  ✓ created ${name} (${opts.public ? 'public' : 'private'})`)
    }
  }

  const { data: final, error: fErr } = await admin.storage.listBuckets()
  if (!fErr) {
    console.log('\nFinal buckets:', (final || []).map((b) => b.name).join(', '))
  }
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
