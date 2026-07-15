import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/stripe', () => ({
  getStripeAsync: vi.fn(() => ({
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  })),
  getPublishableKey: vi.fn(),
  getWebhookSecret: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
}))

Object.defineProperty(global, 'fetch', {
  value: vi.fn(),
  writable: true,
})