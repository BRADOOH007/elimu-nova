import { test, expect } from '@playwright/test'

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('pricing page loads with plans', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/pricing|choose|plan/i)
  })

  test('shows feature lists for each plan', async ({ page }) => {
    const features = page.locator('ul li').first()
    await expect(features).toBeVisible()
  })
})

test.describe('Billing Flow', () => {
  test('redirects to signin when accessing billing without auth', async ({ page }) => {
    await page.goto('/teacher/billing')
    await expect(page).toHaveURL(/.*auth\/signin/)
  })

  test('redirects to signin when accessing school admin billing', async ({ page }) => {
    await page.goto('/school-admin/billing')
    await expect(page).toHaveURL(/.*auth\/signin/)
  })
})

test.describe('Subscription Checkout Flow', () => {
  test('create-checkout endpoint returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/subscription/create-checkout', {
      data: {
        packageId: 'test-package',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      },
    })
    expect(response.status()).toBe(401)
  })

  test('start-trial endpoint returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/subscription/start-trial')
    expect(response.status()).toBe(401)
  })
})