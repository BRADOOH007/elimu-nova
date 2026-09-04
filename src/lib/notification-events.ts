import { sseBus } from '@/lib/sse-events'

/**
 * Publish a "new-notification" event on the user's realtime channel so their
 * open dashboard(s) refresh the unread badge + banner instantly instead of the
 * 30–60s polling interval. Purely best-effort — never throws.
 */
export function emitNewNotification(userId: string, payload?: { title?: string; type?: string }): void {
  try {
    sseBus.publish(`notifications:${userId}`, 'new-notification', payload || {})
  } catch {
    // best-effort; SSE is optional
  }
}

/** Realtime channel name for a user's notifications. */
export function notificationChannel(userId: string): string {
  return `notifications:${userId}`
}
