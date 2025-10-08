import {
  ASSIGNABLE_STAGES,
  MAX_BILLS_PER_USER,
  isStageAssignable,
  getAssignableStageLabels,
  canUserAcceptMoreBills,
  getRemainingBillSlots,
  canAssignBillToUser,
  getStageTransitionRules,
  getTargetStageForAssignment,
  shouldSetSubmittedAtOnAssignment
} from '@/app/lib/domain/bills/business-logic'
import { BILL_STAGE } from '@/app/lib/domain/bills/stage-config'

describe('Business Logic', () => {
  describe('Constants', () => {
    it('should define correct assignable stages', () => {
      expect(ASSIGNABLE_STAGES).toEqual([BILL_STAGE.DRAFT, BILL_STAGE.SUBMITTED])
    })

    it('should define correct max bills per user', () => {
      expect(MAX_BILLS_PER_USER).toBe(3)
    })
  })

  describe('isStageAssignable', () => {
    it('should return true for assignable stages', () => {
      expect(isStageAssignable(BILL_STAGE.DRAFT)).toBe(true)
      expect(isStageAssignable(BILL_STAGE.SUBMITTED)).toBe(true)
    })

    it('should return false for non-assignable stages', () => {
      expect(isStageAssignable(BILL_STAGE.APPROVED)).toBe(false)
      expect(isStageAssignable(BILL_STAGE.PAYING)).toBe(false)
      expect(isStageAssignable(BILL_STAGE.ON_HOLD)).toBe(false)
      expect(isStageAssignable(BILL_STAGE.REJECTED)).toBe(false)
      expect(isStageAssignable(BILL_STAGE.PAID)).toBe(false)
    })
  })

  describe('getAssignableStageLabels', () => {
    it('should return labels of assignable stages', () => {
      const labels = getAssignableStageLabels()
      expect(labels).toEqual(['Draft', 'Submitted'])
    })
  })

  describe('canUserAcceptMoreBills', () => {
    it('should return true when user has fewer than max bills', () => {
      expect(canUserAcceptMoreBills(0)).toBe(true)
      expect(canUserAcceptMoreBills(1)).toBe(true)
      expect(canUserAcceptMoreBills(2)).toBe(true)
    })

    it('should return false when user has reached max bills', () => {
      expect(canUserAcceptMoreBills(3)).toBe(false)
      expect(canUserAcceptMoreBills(4)).toBe(false)
      expect(canUserAcceptMoreBills(10)).toBe(false)
    })
  })

  describe('getRemainingBillSlots', () => {
    it('should return correct remaining slots', () => {
      expect(getRemainingBillSlots(0)).toBe(3)
      expect(getRemainingBillSlots(1)).toBe(2)
      expect(getRemainingBillSlots(2)).toBe(1)
      expect(getRemainingBillSlots(3)).toBe(0)
    })

    it('should return 0 when user has exceeded max bills', () => {
      expect(getRemainingBillSlots(4)).toBe(0)
      expect(getRemainingBillSlots(10)).toBe(0)
    })
  })

  describe('canAssignBillToUser', () => {
    it('should allow assignment for valid stage and user capacity', () => {
      const result = canAssignBillToUser(BILL_STAGE.DRAFT, 2)
      expect(result).toEqual({ canAssign: true })
    })

    it('should reject assignment for non-assignable stage', () => {
      const result = canAssignBillToUser(BILL_STAGE.APPROVED, 1)
      expect(result).toEqual({
        canAssign: false,
        reason: "Bills in 'Approved' stage cannot be assigned"
      })
    })

    it('should reject assignment when user is at max capacity', () => {
      const result = canAssignBillToUser(BILL_STAGE.DRAFT, 3)
      expect(result).toEqual({
        canAssign: false,
        reason: 'User has reached the maximum limit of 3 bills'
      })
    })

    it('should reject assignment when user exceeds max capacity', () => {
      const result = canAssignBillToUser(BILL_STAGE.SUBMITTED, 5)
      expect(result).toEqual({
        canAssign: false,
        reason: 'User has reached the maximum limit of 3 bills'
      })
    })

    it('should reject assignment for rejected stage', () => {
      const result = canAssignBillToUser(BILL_STAGE.REJECTED, 1)
      expect(result).toEqual({
        canAssign: false,
        reason: "Bills in 'Rejected' stage cannot be assigned"
      })
    })
  })

  describe('getStageTransitionRules', () => {
    it('should return correct transition rules', () => {
      const rules = getStageTransitionRules()
      expect(rules).toEqual({
        'Draft': 'Submitted',
        'Submitted': 'Submitted'
      })
    })
  })

  describe('getTargetStageForAssignment', () => {
    it('should return Submitted for Draft stage', () => {
      const targetStage = getTargetStageForAssignment(BILL_STAGE.DRAFT)
      expect(targetStage).toBe('Submitted')
    })

    it('should return Submitted for Submitted stage', () => {
      const targetStage = getTargetStageForAssignment(BILL_STAGE.SUBMITTED)
      expect(targetStage).toBe('Submitted')
    })

    it('should return null for non-assignable stages', () => {
      const targetStage = getTargetStageForAssignment(BILL_STAGE.APPROVED)
      expect(targetStage).toBe(null)
    })

    it('should return null for rejected stage', () => {
      const targetStage = getTargetStageForAssignment(BILL_STAGE.REJECTED)
      expect(targetStage).toBe(null)
    })
  })

  describe('shouldSetSubmittedAtOnAssignment', () => {
    it('should return true for Draft stage', () => {
      expect(shouldSetSubmittedAtOnAssignment(BILL_STAGE.DRAFT)).toBe(true)
    })

    it('should return false for non-Draft stages', () => {
      expect(shouldSetSubmittedAtOnAssignment(BILL_STAGE.SUBMITTED)).toBe(false)
      expect(shouldSetSubmittedAtOnAssignment(BILL_STAGE.APPROVED)).toBe(false)
      expect(shouldSetSubmittedAtOnAssignment(BILL_STAGE.REJECTED)).toBe(false)
    })
  })
})
