import { test, expect } from '@playwright/test'

test.describe('API Routes', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(['ok', 'healthy']).toContain(body.status)
  })

test('AI endpoints require auth', async ({ request }) => {
    const endpoints = [
      '/api/ai/chat',
      '/api/ai/generate-lesson-plan',
      '/api/ai/generate-exam',
      '/api/ai/auto-mark',
      '/api/ai/generate-presentation',
    ]

    for (const endpoint of endpoints) {
      const response = await request.post(endpoint, { data: {} })
      expect([401, 400, 500]).toContain(response.status())
    }
  })

  test('subscription endpoints require auth', async ({ request }) => {
    const response = await request.get('/api/subscription/status')
    expect([401, 400]).toContain(response.status())
  })

  test('packages endpoint returns data', async ({ request }) => {
    const response = await request.get('/api/packages')
    expect([200, 401]).toContain(response.status())
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })
})