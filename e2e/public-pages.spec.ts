import { test, expect } from '@playwright/test'

test.describe('Public Pages', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1').first()).toContainText(/about/i)
  })

  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('h1').first()).toContainText(/contact/i)
    await expect(page.locator('form').first()).toBeVisible()
  })

  test('pricing page loads directly', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('h1, h2').first()).toContainText(/pricing|choose|plan/i)
  })

  test('help center page loads', async ({ page }) => {
    await page.goto('/help')
    await expect(page.locator('h1').first()).toContainText(/help/i)
  })

  test('demo page loads', async ({ page }) => {
    await page.goto('/demo')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('logo links to home', async ({ page }) => {
    await page.goto('/about')
    await page.locator('header a[href="/"]').first().click()
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })

  test('footer links exist', async ({ page }) => {
    await page.goto('/')
    const footerLinks = page.locator('footer a')
    await expect(footerLinks.first()).toBeVisible()
  })
})