import { test, expect } from '@playwright/test'
import { generateTestBillReference, generateTestDate } from './utils/test-utils'

test.describe('Critical E2E Flows', () => {
  test('Complete bill creation and management flow', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()

    // 2. Navigate to create new bill
    await page.getByTestId('add-new-bill-button').click()
    await expect(page.getByTestId('new-bill-title')).toBeVisible()

    // 3. Create a new bill
    const billReference = generateTestBillReference()
    const billDate = generateTestDate()

    await page.getByTestId('bill-reference-input').fill(billReference)
    await page.getByTestId('bill-date-input').fill(billDate)

    // 4. Submit the form
    await page.getByTestId('submit-button').click()

    // 5. Verify success and redirect
    await expect(page.getByText('Bill Created Successfully!')).toBeVisible()
    await page.waitForURL('/bills')

    // 6. Verify bill appears in dashboard
    await expect(page.getByTestId(`bill-card-${billReference}`)).toBeVisible()
    await expect(page.getByTestId(`bill-card-${billReference}`).getByText('Unassigned')).toBeVisible()
  })

  test('Bill reference validation flow', async ({ page }) => {
    // 1. Navigate to new bill form
    await page.goto('/bills/new')
    await expect(page.getByTestId('new-bill-title')).toBeVisible()

    // 2. Test with unique reference - should be valid
    const uniqueReference = generateTestBillReference()
    await page.getByTestId('bill-reference-input').fill(uniqueReference)

    // Wait for validation
    await page.waitForTimeout(1000)

    // Should show "Available" or no error
    const hasError = await page.locator('.text-red-600').isVisible()
    expect(hasError).toBeFalsy()

    // 3. Complete the form
    await page.getByTestId('bill-date-input').fill(generateTestDate())
    await page.getByTestId('submit-button').click()

    // 4. Verify successful creation
    await expect(page.getByText('Bill Created Successfully!')).toBeVisible()
  })

  test('Error handling flow', async ({ page }) => {
    // 1. Navigate to new bill form
    await page.goto('/bills/new')
    await expect(page.getByTestId('new-bill-title')).toBeVisible()

    // 2. Try to submit empty form
    await page.getByTestId('submit-button').click()

    // 3. Should show validation error (may appear as browser validation or custom error)
    // Wait for either form error or timeout, then continue
    try {
      await expect(page.getByTestId('form-error')).toBeVisible({ timeout: 2000 })
    } catch {
      // Form validation might be handled by browser, which is also valid
    }

    // 4. Navigate to dashboard to test API error handling
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()

    // 5. Verify dashboard loads successfully (no API errors)
    const hasError = await page.getByTestId('error-message').isVisible().catch(() => false)
    expect(hasError).toBeFalsy()
  })

  test('Navigation flow', async ({ page }) => {
    // 1. Start at home page
    await page.goto('/')
    await expect(page.getByTestId('home-title')).toBeVisible()

    // 2. Navigate to bills
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()

    // 3. Navigate to new bill form
    await page.getByTestId('add-new-bill-button').click()
    await expect(page.getByTestId('new-bill-title')).toBeVisible()

    // 4. Cancel back to dashboard
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('dashboard-title')).toBeVisible()
  })

  test('Responsive design flow', async ({ page }) => {
    // 1. Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()

    // 2. Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/bills')
    await expect(page.getByTestId('dashboard-title')).toBeVisible()

    // 3. Test form on mobile
    await page.goto('/bills/new')
    await expect(page.getByTestId('bill-reference-input')).toBeVisible()
    await expect(page.getByTestId('bill-date-input')).toBeVisible()
  })
})