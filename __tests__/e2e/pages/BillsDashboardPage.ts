import { Page, Locator, expect } from '@playwright/test'
import { waitForPageLoad } from '../utils/test-utils'

export class BillsDashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly addNewBillButton: Locator
  readonly loadingMessage: Locator
  readonly errorMessage: Locator
  readonly stageColumns: Locator
  readonly stageGrid: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByTestId('dashboard-title')
    this.addNewBillButton = page.getByTestId('add-new-bill-button')
    this.loadingMessage = page.getByText('Loading bills...')
    this.errorMessage = page.getByTestId('error-message')
    this.stageColumns = page.locator('[data-testid^="stage-column-"]')
    this.stageGrid = page.getByTestId('bills-grid')
  }

  async navigate() {
    await this.page.goto('/bills')
    await waitForPageLoad(this.page)
  }

  async waitForDataLoaded() {
    // Wait for loading to complete
    try {
      await this.loadingMessage.waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
      // Loading message might not appear if data loads quickly
    }

    // Ensure the main content is visible
    await expect(this.heading).toBeVisible()
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.addNewBillButton).toBeVisible()
  }

  async clickAddNewBill() {
    await this.addNewBillButton.click()
    await waitForPageLoad(this.page)
  }

  async getStageColumn(stageName: string) {
    const stageTestId = `stage-column-${stageName.toLowerCase().replace(' ', '-')}`
    return this.page.getByTestId(stageTestId)
  }

  async getBillsInStage(stageName: string) {
    const stageColumn = await this.getStageColumn(stageName)
    return stageColumn.locator('[data-testid^="bill-card-"]')
  }

  async getBillByReference(billReference: string) {
    return this.page.getByTestId(`bill-card-${billReference}`)
  }

  async assignBillToUser(billReference: string, userName: string) {
    const select = this.page.getByTestId(`assignment-select-${billReference}`)

    await select.selectOption({ label: userName })

    // Wait for the assignment to complete
    await this.page.waitForTimeout(1000)
  }

  async verifyBillAssignment(billReference: string, userName: string) {
    const billCard = this.page.getByTestId(`bill-card-${billReference}`)
    await expect(billCard.getByText(`Assigned to: ${userName}`)).toBeVisible()
  }

  async verifyBillIsUnassigned(billReference: string) {
    const billCard = this.page.getByTestId(`bill-card-${billReference}`)
    await expect(billCard.getByText('Assigned to:')).toBeVisible()
    await expect(billCard.getByText('Unassigned')).toBeVisible()
  }

  async getStageColumnCount(stageName: string) {
    const stageColumn = await this.getStageColumn(stageName)
    const stageHeader = stageColumn.locator('h2').first()
    const countText = await stageHeader.textContent()
    const match = countText?.match(/\((\d+)\)/)
    return match ? parseInt(match[1]) : 0
  }

  async verifyStageExists(stageName: string) {
    const stageColumn = await this.getStageColumn(stageName)
    await expect(stageColumn).toBeVisible()
  }

  async verifyAllExpectedStagesPresent() {
    const expectedStages = ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid']

    for (const stage of expectedStages) {
      await this.verifyStageExists(stage)
    }
  }

  async hasErrorMessage() {
    return this.errorMessage.isVisible()
  }

  async getErrorMessageText() {
    return this.errorMessage.textContent()
  }
}