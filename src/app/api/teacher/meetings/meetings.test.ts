import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = {
  teacher: { findUnique: vi.fn(), findFirst: vi.fn() },
  meeting: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/zoom-api', () => ({
  createZoomMeeting: vi.fn(),
  updateZoomMeeting: vi.fn(),
  deleteZoomMeeting: vi.fn(),
  isZoomConfigured: vi.fn(() => false),
}))
vi.mock('@/lib/with-auth', () => ({
  requireAuth: vi.fn(() => ({ id: 'user-1', email: 'teacher@test.com', role: 'TEACHER', name: 'Teacher' })),
  requireTeacher: vi.fn(() => ({ id: 'user-1', email: 'teacher@test.com', role: 'TEACHER', name: 'Teacher' })),
  requireRole: vi.fn(() => ({ id: 'user-1', email: 'teacher@test.com', role: 'TEACHER', name: 'Teacher' })),
  requireSuperAdmin: vi.fn(() => ({ id: 'user-1', email: 'admin@test.com', role: 'SUPER_ADMIN', name: 'Admin' })),
}))

describe('Teacher Meetings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/teacher/meetings', () => {
    it('creates a meeting with valid data', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({ id: 't-1', schoolId: 's-1', school: { id: 's-1' } })
      mockPrisma.meeting.create.mockResolvedValue({
        id: 'm-1', title: 'Test Class', date: new Date('2026-07-24T10:00:00Z'),
        time: '10:00', duration: 60, location: null,
        zoomMeetingId: null, zoomMeetingPassword: null, zoomJoinUrl: null,
        zoomProvider: 'manual', zoomMeetingRecording: null,
      })

      const { POST } = await import('./route') as any
      const req = new Request('http://localhost:3000/api/teacher/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Class', date: '2026-07-24', time: '10:00', duration: 60 }),
      })
      const res = await POST(req as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.meeting.title).toBe('Test Class')
    })

    it('rejects missing title', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({ id: 't-1', schoolId: 's-1' })

      const { POST } = await import('./route') as any
      const req = new Request('http://localhost:3000/api/teacher/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2026-07-24', time: '10:00' }),
      })
      const res = await POST(req as any)
      expect(res.status).toBe(400)
    })
  })
})
