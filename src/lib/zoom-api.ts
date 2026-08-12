import { z } from 'zod'

// Server-to-Server OAuth credentials — read from DB (super-admin config) first,
// then fall back to environment variables.
async function loadOAuthConfig(): Promise<{ accountId: string; clientId: string; clientSecret: string }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { decryptPassword } = await import('./password-encryption')
    const keys = ['zoom_account_id', 'zoom_client_id', 'zoom_client_secret']
    const rows = await (prisma as any).systemSettings.findMany({ where: { key: { in: keys } } })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value ? (decryptPassword(r.value) || r.value) : ''
    return {
      accountId: map.zoom_account_id || process.env.ZOOM_ACCOUNT_ID || '',
      clientId: map.zoom_client_id || process.env.ZOOM_CLIENT_ID || '',
      clientSecret: map.zoom_client_secret || process.env.ZOOM_CLIENT_SECRET || '',
    }
  } catch {
    return {
      accountId: process.env.ZOOM_ACCOUNT_ID || '',
      clientId: process.env.ZOOM_CLIENT_ID || '',
      clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    }
  }
}

const log = (level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => {
  const entry = { ts: new Date().toISOString(), scope: 'zoom-api', level, msg, ...meta }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

const CreateMeetingSchema = z.object({
  topic: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  duration: z.number().int().min(1).max(1440),
  password: z.string().min(1).max(16).optional(),
  description: z.string().max(2000).optional(),
})

const UpdateMeetingSchema = z.object({
  topic: z.string().min(1).max(200).optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(1440).optional(),
  password: z.string().min(1).max(16).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['end']).optional(),
})

export type CreateMeetingOptions = z.infer<typeof CreateMeetingSchema>
export type UpdateMeetingOptions = z.infer<typeof UpdateMeetingSchema>

interface ZoomMeetingResponse {
  id: number
  join_url: string
  password: string
  topic: string
  start_time: string
  duration: number
}

interface ZoomUserResponse {
  id: string
  first_name: string
  last_name: string
  email: string
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken
  }

  const oauth = await loadOAuthConfig()
  if (!oauth.accountId || !oauth.clientId || !oauth.clientSecret) {
    throw new Error('Zoom Server-to-Server OAuth credentials not configured')
  }

  const tokenUrl = 'https://zoom.us/oauth/token'
  const auth = Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString('base64')

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(1000 * Math.pow(2, attempt), 10000)
      log('warn', `Retrying OAuth token request (attempt ${attempt + 1})`, { backoffMs: backoff })
      await sleep(backoff)
    }
    try {
      const res = await fetch(`${tokenUrl}?grant_type=account_credentials&account_id=${oauth.accountId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (res.status === 429) {
        lastError = new Error('Rate limited')
        log('warn', 'Zoom OAuth rate limited', { attempt: attempt + 1 })
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Zoom OAuth failed: ${res.status} ${text}`)
      }

      const data = await res.json()
      cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      }
      log('info', 'OAuth token acquired', { expiresIn: data.expires_in })
      return data.access_token
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === 2) log('error', 'OAuth token failed after retries', { error: lastError.message })
    }
  }
  throw lastError || new Error('Failed to get access token')
}

async function zoomFetch<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const accessToken = await getAccessToken()

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(1000 * Math.pow(2, attempt), 10000)
      log('warn', `Retrying Zoom API request`, { url, attempt: attempt + 1, backoffMs: backoff })
      await sleep(backoff)
    }

    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (res.status === 429) {
        log('warn', 'Zoom API rate limited', { url, attempt: attempt + 1 })
        continue
      }

      const text = await res.text()
      let parsed: any
      try { parsed = JSON.parse(text) } catch (e) { console.warn('[ZoomAPI] Failed to parse response:', e); parsed = { message: text } }

      if (!res.ok) {
        log('error', 'Zoom API request failed', { url, status: res.status, error: parsed })
        return { ok: false, status: res.status, error: parsed.message || parsed.error || JSON.stringify(parsed) }
      }

      return { ok: true, status: res.status, data: parsed as T }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt === 2) {
        log('error', 'Zoom API request failed after retries', { url, error: msg })
        return { ok: false, status: 0, error: msg }
      }
    }
  }

  return { ok: false, status: 0, error: 'Max retries exceeded' }
}

export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeetingResponse | null> {
  const parsed = CreateMeetingSchema.safeParse(options)
  if (!parsed.success) {
    log('error', 'Invalid create meeting options', { errors: parsed.error.flatten() })
    return null
  }

  const { data } = parsed
  const result = await zoomFetch<ZoomMeetingResponse>('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    body: {
      topic: data.topic,
      type: 2,
      start_time: data.startTime,
      duration: data.duration,
      password: data.password || undefined,
      agenda: data.description || undefined,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud',
      },
    },
  })

  if (!result.ok || !result.data) {
    log('error', 'Failed to create Zoom meeting', { status: result.status, error: result.error })
    return null
  }

  log('info', 'Zoom meeting created', { meetingId: result.data.id, topic: result.data.topic })
  return {
    id: result.data.id,
    join_url: result.data.join_url,
    password: result.data.password || '',
    topic: result.data.topic,
    start_time: result.data.start_time,
    duration: result.data.duration,
  }
}

export async function updateZoomMeeting(meetingId: string, options: UpdateMeetingOptions): Promise<boolean> {
  const parsed = UpdateMeetingSchema.safeParse(options)
  if (!parsed.success) {
    log('error', 'Invalid update meeting options', { errors: parsed.error.flatten() })
    return false
  }

  const body: Record<string, unknown> = {}
  if (parsed.data.topic) body.topic = parsed.data.topic
  if (parsed.data.startTime) body.start_time = parsed.data.startTime
  if (parsed.data.duration) body.duration = parsed.data.duration
  if (parsed.data.password) body.password = parsed.data.password
  if (parsed.data.description) body.agenda = parsed.data.description

  if (parsed.data.status === 'end') {
    // End meeting via PUT with status field
    const result = await zoomFetch<{ id: number }>(`https://api.zoom.us/v2/meetings/${meetingId}/status`, {
      method: 'PUT',
      body: { action: 'end' },
    })

    if (!result.ok) {
      log('error', 'Failed to end Zoom meeting', { meetingId, status: result.status, error: result.error })
      return false
    }
    log('info', 'Zoom meeting ended', { meetingId })
    return true
  }

  // Standard update
  const result = await zoomFetch<never>(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    body,
  })

  if (!result.ok) {
    log('error', 'Failed to update Zoom meeting', { meetingId, status: result.status, error: result.error })
    return false
  }

  log('info', 'Zoom meeting updated', { meetingId })
  return true
}

export async function deleteZoomMeeting(meetingId: string): Promise<boolean> {
  const result = await zoomFetch<never>(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
  })

  if (!result.ok) {
    log('error', 'Failed to delete Zoom meeting', { meetingId, status: result.status, error: result.error })
    return false
  }

  log('info', 'Zoom meeting deleted', { meetingId })
  return true
}

export async function getZoomMeeting(meetingId: string): Promise<ZoomMeetingResponse | null> {
  const result = await zoomFetch<ZoomMeetingResponse>(`https://api.zoom.us/v2/meetings/${meetingId}`)

  if (!result.ok || !result.data) {
    log('warn', 'Failed to get Zoom meeting', { meetingId, status: result.status, error: result.error })
    return null
  }

  return {
    id: result.data.id,
    join_url: result.data.join_url,
    password: result.data.password || '',
    topic: result.data.topic,
    start_time: result.data.start_time,
    duration: result.data.duration,
  }
}

export async function getMeetingRecordings(meetingId: string): Promise<Array<{
  id: string
  file_type: string
  download_url: string
  file_size: number
  recording_start: string
  recording_end: string
}> | null> {
  const result = await zoomFetch<{ recording_files: Array<{ id: string; file_type: string; download_url: string; file_size: number; recording_start: string; recording_end: string }> }>(
    `https://api.zoom.us/v2/meetings/${meetingId}/recordings`
  )

  if (!result.ok || !result.data) {
    log('warn', 'Failed to get meeting recordings', { meetingId, status: result.status, error: result.error })
    return null
  }

  return result.data.recording_files || []
}

export function isZoomConfigured(): boolean {
  return !!(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET)
}

export { CreateMeetingSchema, UpdateMeetingSchema }
