import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('home-title')).toBeVisible({ timeout: 10000 })
  })

  test('should load the bills dashboard', async ({ page }) => {
    await page.goto('/bills', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 })
  })

  test('should load the new bill form', async ({ page }) => {
    await page.goto('/bills/new', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('new-bill-title')).toBeVisible({ timeout: 10000 })
  })

  test('should load the users page', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bills')
  })
})