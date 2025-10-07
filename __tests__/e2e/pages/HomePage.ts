import { Page, Locator, expect } from '@playwright/test'
import { waitForPageLoad } from '@/__tests__/e2e/utils/test-utils'

export class HomePage {
  readonly page: Page
  readonly heading: Locator
  readonly subheading: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByTestId('home-title')
    this.subheading = page.getByText('Please view the README.md file for the task instructions')
  }

  async navigate() {
    await this.page.goto('/')
    await waitForPageLoad(this.page)
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.subheading).toBeVisible()
  }

  async navigateToBills() {
    // Navigate to bills page via URL since there's no direct link on home page
    await this.page.goto('/bills')
    await waitForPageLoad(this.page)
  }
}