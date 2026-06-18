/**
 * High-level caching helpers for ElimuNova.
 *
 * Pattern: cache-aside
 *   1. Check Redis for key
 *   2. If hit → return cached value
 *   3. If miss → run DB query, write to cache, return value
 *
 * TTL strategy:
 *   - School info:        10 minutes  (rarely changes)
 *   - Dashboard stats:    2 minutes   (changes on activity)
 *   - User profile:       5 minutes   (changes on edit)
 *   - Notifications:      30 seconds  (needs to feel near-realtime)
 *   - Lesson plans list:  5 minutes   (teacher edits are infrequent)
 *   - Live session state: 5 seconds   (near-realtime for whiteboard)
 */

import { cache } from '@/lib/redis'

/* ── Generic cache-aside wrapper ── */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await cache.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch { /* Redis miss or parse error — fall through */ }

  const data = await fetcher()
  try {
    await cache.set(key, JSON.stringify(data), ttlSeconds)
  } catch { /* Cache write failure is non-fatal */ }
  return data
}

/* ── Invalidate a cache key ── */
export async function invalidateCache(key: string): Promise<void> {
  try { await cache.del(key) } catch { /* silent */ }
}

/* ── Invalidate all keys matching a prefix ── */
export async function invalidatePattern(prefix: string): Promise<void> {
  // For Upstash we don't support SCAN, so we track keys by convention
  // Key pattern: prefix:id — invalidate by exact key
  try { await cache.del(prefix) } catch { /* silent */ }
}

/* ── Pre-built cache keys ── */
export const CacheKeys = {
  schoolInfo:      (schoolId: string)  => `school:info:${schoolId}`,
  dashboardStats:  (teacherId: string) => `teacher:stats:${teacherId}`,
  studentDash:     (studentId: string) => `student:dash:${studentId}`,
  userProfile:     (userId: string)    => `user:profile:${userId}`,
  notifications:   (userId: string)    => `user:notifs:${userId}`,
  lessonPlans:     (teacherId: string) => `teacher:plans:${teacherId}`,
  liveSession:     (sessionId: string) => `live:${sessionId}`,
  classStudents:   (classId: string)   => `class:students:${classId}`,
  parentChildren:  (parentId: string)  => `parent:children:${parentId}`,
  assignmentStats: (assignmentId: string) => `assignment:stats:${assignmentId}`,
}

/* ── TTL constants (seconds) ── */
export const TTL = {
  REALTIME:  5,    // live sessions, notifications
  SHORT:     30,   // stats that update frequently
  MEDIUM:    120,  // dashboard data
  STANDARD:  300,  // profiles, lesson plans
  LONG:      600,  // school info, rarely-changing data
}
