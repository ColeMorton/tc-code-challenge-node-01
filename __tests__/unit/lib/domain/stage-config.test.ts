import {
  BILL_STAGE,
  STAGE_ORDER,
  getStageConfig,
  getAllStageLabels,
  type BillStageConfig,
  type BillStageKey,
  type BillStageLabel,
  type BillStageValue
} from '@/app/lib/domain/bills/stage-config'

describe('Stage Configuration', () => {
  describe('BILL_STAGE constants', () => {
    it('should define all required stages with correct properties', () => {
      expect(BILL_STAGE.DRAFT).toEqual({
        label: 'Draft',
        colorClass: 'bg-gray-400',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.SUBMITTED).toEqual({
        label: 'Submitted',
        colorClass: 'bg-blue-500',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.APPROVED).toEqual({
        label: 'Approved',
        colorClass: 'bg-green-500',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.PAYING).toEqual({
        label: 'Paying',
        colorClass: 'bg-yellow-500',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.ON_HOLD).toEqual({
        label: 'On Hold',
        colorClass: 'bg-red-500',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.REJECTED).toEqual({
        label: 'Rejected',
        colorClass: 'bg-red-600',
        textClass: 'text-white'
      })

      expect(BILL_STAGE.PAID).toEqual({
        label: 'Paid',
        colorClass: 'bg-green-600',
        textClass: 'text-white'
      })
    })

    it('should have all stages with proper structure', () => {
      Object.values(BILL_STAGE).forEach(stage => {
        expect(stage).toHaveProperty('label')
        expect(stage).toHaveProperty('colorClass')
        expect(stage).toHaveProperty('textClass')
        expect(typeof stage.label).toBe('string')
        expect(typeof stage.colorClass).toBe('string')
        expect(typeof stage.textClass).toBe('string')
      })
    })
  })

  describe('STAGE_ORDER', () => {
    it('should contain all stage labels in correct order', () => {
      expect(STAGE_ORDER).toEqual([
        'Draft',
        'Submitted',
        'Approved',
        'Paying',
        'On Hold',
        'Rejected',
        'Paid'
      ])
    })

    it('should match the order of BILL_STAGE values', () => {
      const expectedOrder = Object.values(BILL_STAGE).map(stage => stage.label)
      expect(STAGE_ORDER).toEqual(expectedOrder)
    })
  })

  describe('getStageConfig', () => {
    it('should return correct config for known stages', () => {
      expect(getStageConfig('Draft')).toEqual(BILL_STAGE.DRAFT)
      expect(getStageConfig('Submitted')).toEqual(BILL_STAGE.SUBMITTED)
      expect(getStageConfig('Approved')).toEqual(BILL_STAGE.APPROVED)
      expect(getStageConfig('Paying')).toEqual(BILL_STAGE.PAYING)
      expect(getStageConfig('On Hold')).toEqual(BILL_STAGE.ON_HOLD)
      expect(getStageConfig('Rejected')).toEqual(BILL_STAGE.REJECTED)
      expect(getStageConfig('Paid')).toEqual(BILL_STAGE.PAID)
    })

    it('should return fallback config for unknown stage', () => {
      const result = getStageConfig('Unknown Stage')
      
      expect(result).toEqual({
        label: 'Unknown Stage',
        colorClass: 'bg-gray-400',
        textClass: 'text-white'
      })
    })

    it('should return fallback config for empty string', () => {
      const result = getStageConfig('')
      
      expect(result).toEqual({
        label: '',
        colorClass: 'bg-gray-400',
        textClass: 'text-white'
      })
    })

    it('should return fallback config for null/undefined', () => {
      const result1 = getStageConfig(null as unknown as string)
      const result2 = getStageConfig(undefined as unknown as string)
      
      expect(result1).toEqual({
        label: null,
        colorClass: 'bg-gray-400',
        textClass: 'text-white'
      })
      
      expect(result2).toEqual({
        label: undefined,
        colorClass: 'bg-gray-400',
        textClass: 'text-white'
      })
    })
  })

  describe('getAllStageLabels', () => {
    it('should return all stage labels', () => {
      const labels = getAllStageLabels()
      
      expect(labels).toEqual([
        'Draft',
        'Submitted',
        'Approved',
        'Paying',
        'On Hold',
        'Rejected',
        'Paid'
      ])
    })

    it('should return the same as STAGE_ORDER', () => {
      expect(getAllStageLabels()).toEqual(STAGE_ORDER)
    })

    it('should return array of strings', () => {
      const labels = getAllStageLabels()
      
      expect(Array.isArray(labels)).toBe(true)
      labels.forEach(label => {
        expect(typeof label).toBe('string')
      })
    })
  })

  describe('Type definitions', () => {
    it('should have proper TypeScript types', () => {
      // Test BillStageConfig type
      const stageConfig: BillStageConfig = {
        label: 'Test',
        colorClass: 'bg-test',
        textClass: 'text-test'
      }
      expect(stageConfig).toBeDefined()

      // Test BillStageKey type
      const stageKey: BillStageKey = 'DRAFT'
      expect(stageKey).toBeDefined()

      // Test BillStageLabel type
      const stageLabel: BillStageLabel = 'Draft'
      expect(stageLabel).toBeDefined()

      // Test BillStageValue type
      const stageValue: BillStageValue = BILL_STAGE.DRAFT
      expect(stageValue).toBeDefined()
    })
  })
})
