import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-title')).toBeVisible()
  })

  test('should load the bills dashboard', async ({ page }) => {
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()
  })

  test('should load the new bill form', async ({ page }) => {
    await page.goto('/bills/new')
    await expect(page.getByTestId('new-bill-title')).toBeVisible()
  })
})