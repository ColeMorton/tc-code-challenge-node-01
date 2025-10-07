/**
 * Bill Business Logic
 * 
 * Centralized business rules and logic for bill management.
 * This module contains core business logic that should be consistent across the application.
 */

import { BILL_STAGE, type BillStageValue } from '@/app/lib/bill-stage-config'

/**
 * Business rule: Which stages allow bill assignment
 */
export const ASSIGNABLE_STAGES = [BILL_STAGE.DRAFT, BILL_STAGE.SUBMITTED] as const

/**
 * Business rule: Maximum number of bills a user can be assigned
 */
export const MAX_BILLS_PER_USER = 3

/**
 * Business rule: Check if a bill stage allows assignment
 */
export function isStageAssignable(stage: { label: string }): boolean {
  return ASSIGNABLE_STAGES.some(assignableStage => assignableStage.label === stage.label)
}

/**
 * Business rule: Get assignable stage labels
 */
export function getAssignableStageLabels(): string[] {
  return ASSIGNABLE_STAGES.map(stage => stage.label)
}

/**
 * Business rule: Check if a user can be assigned more bills
 */
export function canUserAcceptMoreBills(currentBillCount: number): boolean {
  return currentBillCount < MAX_BILLS_PER_USER
}

/**
 * Business rule: Get remaining bill slots for a user
 */
export function getRemainingBillSlots(currentBillCount: number): number {
  return Math.max(0, MAX_BILLS_PER_USER - currentBillCount)
}

/**
 * Business rule: Check if a bill can be assigned to a user
 */
export function canAssignBillToUser(
  stage: BillStageValue,
  userCurrentBillCount: number
): { canAssign: boolean; reason?: string } {
  if (!isStageAssignable(stage)) {
    return {
      canAssign: false,
      reason: `Bills in '${stage.label}' stage cannot be assigned`
    }
  }

  if (!canUserAcceptMoreBills(userCurrentBillCount)) {
    return {
      canAssign: false,
      reason: `User has reached the maximum limit of ${MAX_BILLS_PER_USER} bills`
    }
  }

  return { canAssign: true }
}

/**
 * Business rule: Get stage transition rules
 */
export function getStageTransitionRules() {
  return {
    // When a Draft bill is assigned, it should transition to Submitted
    [BILL_STAGE.DRAFT.label]: BILL_STAGE.SUBMITTED.label,
    // Submitted bills remain Submitted when assigned
    [BILL_STAGE.SUBMITTED.label]: BILL_STAGE.SUBMITTED.label
  } as const
}

/**
 * Business rule: Get the target stage for a bill assignment
 */
export function getTargetStageForAssignment(currentStage: { label: string }): string | null {
  const transitionRules = getStageTransitionRules()
  return transitionRules[currentStage.label as keyof typeof transitionRules] || null
}

/**
 * Business rule: Check if assignment should set submittedAt timestamp
 */
export function shouldSetSubmittedAtOnAssignment(currentStage: { label: string }): boolean {
  return currentStage.label === BILL_STAGE.DRAFT.label
}
