import { testPrisma, resetDatabase, seedRequiredData, getTestData, createTestBill } from '../testUtils'
import { createBill, validateBillReference, assignBillAction } from '../testActions'

describe('Bills API Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
  })

  describe('Bill Creation API', () => {
    it('should create a new bill with unique reference', async () => {
      await seedRequiredData()

      const billData = {
        billReference: 'BILL-UNIQUE-001',
        billDate: '2024-01-15'
      }

      const bill = await createBill(billData)
      
      expect(bill.billReference).toBe(billData.billReference)
      expect(bill.billDate).toEqual(new Date(billData.billDate))
      
      // Verify it's in Draft stage by checking the stage ID
      const draftStage = await testPrisma.billStage.findFirst({
        where: { label: 'Draft' }
      })
      expect(bill.billStageId).toBe(draftStage?.id)
    })

    it('should enforce bill reference uniqueness', async () => {
      await seedRequiredData()

      const duplicateReference = 'BILL-DUPLICATE-001'

      // First creation should succeed
      await createBill({
        billReference: duplicateReference,
        billDate: '2024-01-15'
      })

      // Second creation should fail
      await expect(createBill({
        billReference: duplicateReference,
        billDate: '2024-01-16'
      })).rejects.toThrow('Bill reference already exists')
    })

    it('should validate required fields', async () => {
      await seedRequiredData()

      // Missing bill reference
      await expect(createBill({
        billReference: '',
        billDate: '2024-01-15'
      })).rejects.toThrow('Bill reference is required')

      // Missing bill date
      await expect(createBill({
        billReference: 'BILL-VALID-REF',
        billDate: ''
      })).rejects.toThrow('Bill date is required')
    })

    it('should validate bill reference format', async () => {
      await seedRequiredData()

      // Validation should work for unique reference
      const validation = await validateBillReference('BILL-NEW-001')
      expect(validation.isValid).toBe(true)

      // Validation should detect duplicates
      await createBill({
        billReference: 'BILL-EXISTS-001',
        billDate: '2024-01-15'
      })

      const duplicateValidation = await validateBillReference('BILL-EXISTS-001')
      expect(duplicateValidation.isValid).toBe(false)
      expect(duplicateValidation.message).toBe('Bill reference already exists')
    })
  })

  describe('Bill Assignment API', () => {
    it('should assign unassigned bills to users', async () => {
      const testData = await getTestData()
      const user = testData.users[0]
      
      // Create a bill in Draft stage (assignable)
      const bill = await createTestBill('BILL-ASSIGN-001', 'Draft')

      const result = await assignBillAction({
        billId: bill.id,
        userId: user.id
      })

      expect(result.success).toBe(true)
      expect(result.bill?.assignedToId).toBe(user.id)
    })

    it('should enforce 3-bill limit per user', async () => {
      const testData = await getTestData()
      const user = testData.users[0]

      // Assign 3 bills (max limit)
      for (let i = 1; i <= 3; i++) {
        const bill = await createTestBill(`BILL-LIMIT-${i}`, 'Draft')
        
        const result = await assignBillAction({
          billId: bill.id,
          userId: user.id
        })
        expect(result.success).toBe(true)
      }

      // Verify user has exactly 3 bills
      const userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(3)

      // 4th assignment should fail
      const fourthBill = await createTestBill('BILL-LIMIT-4', 'Draft')
      
      const result = await assignBillAction({
        billId: fourthBill.id,
        userId: user.id
      })
      expect(result.success).toBe(false)
      expect(result.message).toBe('User has reached the maximum limit of 3 assigned bills')
    })

    it('should only assign bills in assignable stages', async () => {
      const testData = await getTestData()
      const user = testData.users[0]

      // Draft and Submitted stages should be assignable
      const assignableStages = ['Draft', 'Submitted']
      const nonAssignableStages = ['Approved', 'Paying', 'On Hold', 'Rejected', 'Paid']

      // Test assignable stages
      for (const stage of assignableStages) {
        const bill = await createTestBill(`BILL-ASSIGNABLE-${stage}`, stage)
        
        const result = await assignBillAction({
          billId: bill.id,
          userId: user.id
        })
        expect(result.success).toBe(true)
      }

      // Test non-assignable stages
      for (const stage of nonAssignableStages) {
        const bill = await createTestBill(`BILL-NON-ASSIGNABLE-${stage}`, stage)
        
        const result = await assignBillAction({
          billId: bill.id,
          userId: user.id
        })
        expect(result.success).toBe(false)
        expect(result.message).toBe(`Bills in ${stage} stage cannot be assigned`)
      }
    })

    it('should handle invalid assignment parameters', async () => {
      const testData = await getTestData()
      const user = testData.users[0]
      const bill = await createTestBill('BILL-INVALID-PARAMS', 'Draft')

      // Non-existent user
      const result1 = await assignBillAction({
        billId: bill.id,
        userId: 'non-existent-user'
      })
      expect(result1.success).toBe(false)
      expect(result1.message).toBe('User not found')

      // Non-existent bill
      const result2 = await assignBillAction({
        billId: 'non-existent-bill',
        userId: user.id
      })
      expect(result2.success).toBe(false)
      expect(result2.message).toBe('Bill not found')
    })
  })
})
