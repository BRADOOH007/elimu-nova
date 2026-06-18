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
} as const

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL or null if Supabase isn't configured.
 */
export async function uploadFile(
  bucket: string,
  path:   string,
  file:   Buffer | Blob,
  contentType: string,
): Promise<string | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true })

  if (error) {
    console.error('[Supabase upload]', error.message)
    return null
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
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
