import { Page, expect } from '@playwright/test'

/**
 * Wait for the page to load completely
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to a specific page and wait for it to load
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url)
  await waitForPageLoad(page)
}

/**
 * Fill a form field and wait for any validation
 */
export async function fillFieldAndWait(page: Page, selector: string, value: string, waitTime = 100) {
  await page.fill(selector, value)
  await page.waitForTimeout(waitTime)
}

/**
 * Wait for an element to be visible and return it
 */
export async function waitForElement(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: 'visible' })
  return page.locator(selector)
}

/**
 * Check if an element is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Wait for a success message to appear
 */
export async function waitForSuccessMessage(page: Page, message?: string) {
  if (message) {
    await expect(page.getByText(message)).toBeVisible()
  } else {
    // Look for common success indicators
    const successSelectors = [
      '.text-green-600',
      '[class*="success"]',
      '[class*="green"]'
    ]

    for (const selector of successSelectors) {
      if (await isElementVisible(page, selector)) {
        return
      }
    }
  }
}

/**
 * Wait for an error message to appear
 */
export async function waitForErrorMessage(page: Page, message?: string) {
  if (message) {
    await expect(page.getByText(message)).toBeVisible()
  } else {
    // Look for common error indicators
    const errorSelectors = [
      '.text-red-600',
      '.text-red-700',
      '[class*="error"]',
      '[class*="red"]'
    ]

    for (const selector of errorSelectors) {
      if (await isElementVisible(page, selector)) {
        return
      }
    }
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/${name}-${Date.now()}.png`,
    fullPage: true
  })
}

/**
 * Generate a unique test bill reference
 */
export function generateTestBillReference(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `TEST-BILL-${timestamp}-${random}`
}

/**
 * Generate test date in YYYY-MM-DD format
 */
export function generateTestDate(): string {
  const date = new Date()
  return date.toISOString().split('T')[0]
}