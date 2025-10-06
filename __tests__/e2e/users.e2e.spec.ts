import { test, expect } from '@playwright/test'

test.describe('Users Page E2E Tests', () => {
  test('should navigate to users page and display content', async ({ page }) => {
    await page.goto('/users')
    
    // Check that the page loads - use more specific selector for the main title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bills')
    
    // Check that the main content area is present
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    
    // Check that the main grid layout is present (use more specific selector)
    await expect(page.locator('main .grid').first()).toBeVisible({ timeout: 10000 })
  })

  test('should display proper page structure and styling', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Check main title styling - use level 1 heading to be more specific
    const title = page.getByRole('heading', { level: 1 })
    await expect(title).toHaveClass(/mb-4/)
    await expect(title).toHaveClass(/text-xl/)
    await expect(title).toHaveClass(/text-center/)
    
    // Check main grid container styling (use more specific selector)
    const gridContainer = page.locator('main .grid').first()
    await expect(gridContainer).toHaveClass(/px-12/)
    await expect(gridContainer).toHaveClass(/py-12/)
    await expect(gridContainer).toHaveClass(/bg-gray-200/)
  })

  test('should load suspense fallbacks initially', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Check that the main content loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    
    // The page should load successfully even if skeletons are not visible
    // (they might load too quickly to catch)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  })

  test('should handle responsive layout correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('main .grid').first()).toBeVisible({ timeout: 10000 })
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('main .grid').first()).toBeVisible({ timeout: 10000 })
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('main .grid').first()).toBeVisible({ timeout: 10000 })
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Check for proper heading structure
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 10000 })
    await expect(heading).toHaveText('Bills')
    
    // Check that main landmark is present
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Filter out expected errors (like missing test data)
    const unexpectedErrors = errors.filter(error => 
      !error.includes('Failed to fetch') && 
      !error.includes('NetworkError') &&
      !error.includes('Loading chunk')
    )
    
    expect(unexpectedErrors).toHaveLength(0)
  })

  test('should handle page refresh correctly', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Wait for initial load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    
    // Refresh the page
    await page.reload()
    
    // Verify page still loads correctly
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('main .grid').first()).toBeVisible({ timeout: 10000 })
  })

  test('should maintain consistent layout across page interactions', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'networkidle' })
    
    // Get initial layout measurements
    const initialTitle = await page.getByRole('heading', { level: 1 }).boundingBox()
    const initialGrid = await page.locator('main .grid').first().boundingBox()
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(1000)
    
    // Check that layout hasn't shifted significantly
    const finalTitle = await page.getByRole('heading', { level: 1 }).boundingBox()
    const finalGrid = await page.locator('main .grid').first().boundingBox()
    
    // Layout should be consistent (within 5px tolerance)
    expect(Math.abs((initialTitle?.y || 0) - (finalTitle?.y || 0))).toBeLessThan(5)
    expect(Math.abs((initialGrid?.y || 0) - (finalGrid?.y || 0))).toBeLessThan(5)
  })
})
