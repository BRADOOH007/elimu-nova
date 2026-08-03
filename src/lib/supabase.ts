/**
 * Supabase client for ElimuNova content library and file storage.
 *
 * Used for:
 *   - Storing generated PDF / PPTX files
 *   - Shared content library (schemes, lesson plans discoverable by school)
 *   - Full-text search across generated content
 *   - AI-generated images storage
 *
 * Core relational data (users, auth, assignments) stays on Neon/Prisma.
 *
 * Setup:
 *   1. Create project at https://supabase.com
 *   2. Add to .env:
 *        NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
 *        SUPABASE_SERVICE_ROLE_KEY="eyJ..."  ← server-side only
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL   || ''
// Supabase supports both anon key and publishable key formats
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                     || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                     || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY  || supabaseAnon

/** Browser-safe client (anon key, RLS enforced) */
export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null

/** Server-side admin client (service role, bypasses RLS) */
export const supabaseAdmin = supabaseUrl && supabaseService
  ? createClient(supabaseUrl, supabaseService, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnon)
}

/* ── Storage bucket names ── */
export const BUCKETS = {
  LESSON_PLANS:    'lesson-plans',    // PDF exports
  SCHEMES:         'schemes-of-work', // PDF exports
  PRESENTATIONS:   'presentations',   // PPTX files
  AI_IMAGES:       'ai-images',       // Generated images
  AVATARS:         'avatars',         // User profile pictures
} as const

/**
 * Ensure a storage bucket exists (idempotent).
 */
export async function ensureBucket(
  bucket: string,
  opts: {
    public?: boolean
    allowedMimeTypes?: string[]
    fileSizeLimit?: number
  } = {},
): Promise<void> {
  if (!supabaseAdmin) return

  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (buckets?.some((b) => b.name === bucket)) return
  } catch { /* list failed, fall through to create attempt */ }

  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: opts.public ?? true,
    ...(opts.allowedMimeTypes ? { allowedMimeTypes: opts.allowedMimeTypes } : {}),
    ...(opts.fileSizeLimit ? { fileSizeLimit: opts.fileSizeLimit } : {}),
  })
  if (error && !String(error.message).toLowerCase().includes('already')) {
    console.warn('[Supabase ensureBucket]', bucket, error.message)
  }
}

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL or null if Supabase isn't configured.
 * Lazily creates the bucket on first upload if it doesn't exist.
 */
export async function uploadFile(
  bucket: string,
  path:   string,
  file:   Buffer | Blob,
  contentType: string,
): Promise<string | null> {
  if (!supabaseAdmin) return null

  let { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true })

  if (error) {
    // Self-heal: missing bucket is the most common first-time failure
    await ensureBucket(bucket)
    const retry = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true })
    data  = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[Supabase upload]', error.message)
    return null
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data!.path)
  return urlData.publicUrl
}

/**
 * Delete a file from storage given its public URL.
 * Returns true if the file was removed from Supabase.
 */
export async function removeFileByUrl(publicUrl: string): Promise<boolean> {
  if (!supabaseAdmin || !publicUrl) return false

  const marker = '/storage/v1/object/public/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return false

  const rest = publicUrl.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return false

  const bucket = rest.slice(0, slash)
  const filePath = rest.slice(slash + 1)
  if (!bucket || !filePath) return false

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath])
    if (error) {
      console.warn('[Supabase remove]', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('[Supabase remove]', e)
    return false
  }
}

/**
 * Get a signed download URL (expires in 1 hour).
 */
export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 3600)

  if (error) return null
  return data.signedUrl
}
