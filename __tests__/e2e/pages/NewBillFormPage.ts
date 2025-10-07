import { Page, Locator, expect } from '@playwright/test'
import { waitForPageLoad, fillFieldAndWait, waitForErrorMessage } from '@/__tests__/e2e/utils/test-utils'

export class NewBillFormPage {
  readonly page: Page
  readonly heading: Locator
  readonly billReferenceInput: Locator
  readonly billDateInput: Locator
  readonly assignedToSelect: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly errorMessage: Locator
  readonly validationMessage: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByTestId('new-bill-title')
    this.billReferenceInput = page.getByTestId('bill-reference-input')
    this.billDateInput = page.getByTestId('bill-date-input')
    this.assignedToSelect = page.getByTestId('assigned-to-select')
    this.submitButton = page.getByTestId('submit-button')
    this.cancelButton = page.getByTestId('cancel-button')
    this.errorMessage = page.getByTestId('form-error')
    this.validationMessage = page.locator('p[class*="text-"]')
    this.successMessage = page.getByText('Bill Created Successfully!')
  }

  async navigate() {
    await this.page.goto('/bills/new')
    await waitForPageLoad(this.page)
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.billReferenceInput).toBeVisible()
    await expect(this.billDateInput).toBeVisible()
    await expect(this.assignedToSelect).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillBillReference(reference: string) {
    await fillFieldAndWait(this.page, '#billReference', reference, 600) // Wait for validation
  }

  async fillBillDate(date: string) {
    await this.billDateInput.fill(date)
  }

  async selectAssignedUser(userName: string) {
    await this.assignedToSelect.selectOption({ label: userName })
  }

  async leaveUnassigned() {
    await this.assignedToSelect.selectOption('')
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async clickCancel() {
    await this.cancelButton.click()
    await waitForPageLoad(this.page)
  }

  async submitValidForm(billReference: string, billDate: string, userName?: string) {
    await this.fillBillReference(billReference)
    await this.fillBillDate(billDate)

    if (userName) {
      await this.selectAssignedUser(userName)
    } else {
      await this.leaveUnassigned()
    }

    await this.submitForm()
  }

  async waitForValidationMessage(type: 'success' | 'error' | 'checking') {
    let expectedClass: string

    switch (type) {
      case 'success':
        expectedClass = 'text-green-600'
        break
      case 'error':
        expectedClass = 'text-red-600'
        break
      case 'checking':
        expectedClass = 'text-gray-500'
        break
    }

    await this.page.waitForSelector(`.${expectedClass}`, { state: 'visible' })
  }

  async hasValidationError() {
    return this.page.locator('.text-red-600').isVisible()
  }

  async getValidationMessage() {
    const message = this.page.locator('p[class*="text-"]:visible').first()
    return message.textContent()
  }

  async hasFormError() {
    return this.errorMessage.isVisible()
  }

  async getFormErrorMessage() {
    return this.errorMessage.textContent()
  }

  async waitForSuccessAndRedirect() {
    await expect(this.successMessage).toBeVisible()

    // Wait for redirect to bills page
    await this.page.waitForURL('/bills')
    await waitForPageLoad(this.page)
  }

  async verifyFormValidation() {
    // Test empty form submission
    await this.submitButton.click()
    await waitForErrorMessage(this.page)

    // Verify required field validation
    await expect(this.billReferenceInput).toHaveAttribute('required')
    await expect(this.billDateInput).toHaveAttribute('required')
  }

  async verifyBillReferenceValidation(reference: string, expectedResult: 'available' | 'exists' | 'checking') {
    await this.fillBillReference(reference)

    switch (expectedResult) {
      case 'checking':
        await this.waitForValidationMessage('checking')
        await expect(this.page.getByText('Checking...')).toBeVisible()
        break
      case 'available':
        await this.waitForValidationMessage('success')
        await expect(this.page.getByText('Available')).toBeVisible()
        break
      case 'exists':
        await this.waitForValidationMessage('error')
        await expect(this.page.getByText('Bill reference already exists')).toBeVisible()
        break
    }
  }

  async isSubmitButtonDisabled() {
    return this.submitButton.isDisabled()
  }

  async waitForFormReady() {
    // Wait for form to be fully interactive
    await expect(this.billReferenceInput).toBeEnabled()
    await expect(this.billDateInput).toBeEnabled()
    await expect(this.assignedToSelect).toBeEnabled()
    await expect(this.submitButton).toBeEnabled()
  }
}