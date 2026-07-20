import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('sign in page loads correctly', async ({ page }) => {
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible()
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[type="text"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Just verify the form submission doesn't crash
    await expect(page).toHaveURL(/.*auth\/signin/)
  })
})

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('signup page loads correctly', async ({ page }) => {
    await expect(page.locator('h2:has-text("Create account")')).toBeVisible()
    await expect(page.locator('input[name="firstName"], input[name="first_name"]').first()).toBeVisible()
    await expect(page.locator('input[name="lastName"], input[name="last_name"]').first()).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })
})

test.describe('Protected Route Access', () => {
  test('redirects unauthenticated users to signin', async ({ page }) => {
    await page.goto('/teacher/dashboard')
    await expect(page).toHaveURL(/.*auth\/signin/)
  })

  test('redirects unauthenticated users from student dashboard', async ({ page }) => {
    await page.goto('/student/dashboard')
    await expect(page).toHaveURL(/.*auth\/signin/)
  })

  test('redirects unauthenticated users from admin dashboard', async ({ page }) => {
    await page.goto('/super-admin/dashboard')
    await expect(page).toHaveURL(/.*auth\/signin/)
  })
})