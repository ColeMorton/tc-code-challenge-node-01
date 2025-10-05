import { GET } from '@/app/api/bills/route'
import { createBill, validateBillReference } from '@/app/bills/actions'
import { POST as assignPOST } from '@/app/api/bills/assign/route'
import { resetDatabase, testPrisma, getTestData, createTestBill, cleanupTestDatabase } from '../testUtils'
import { NextRequest } from 'next/server'

interface BillWithRelations {
  id: string
  billReference: string
  billDate: string
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  billStage: {
    id: string
    label: string
    colour: string
  }
}

// Mock the main prisma instance to use our test database
jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { testPrisma } = require('../testUtils')
  return {
    prisma: testPrisma
  }
})

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

afterAll(async () => {
  await cleanupTestDatabase()
})

describe('Bill Lifecycle Workflow Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('Complete Bill Creation to Assignment Workflow', () => {
    it('should handle full bill creation and assignment workflow', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Step 1: Validate bill reference is available
      const validateData = await validateBillReference('WORKFLOW-001')

      expect(validateData.isValid).toBe(true)
      expect(validateData.message).toBe('Available')

      // Step 2: Create new bill
      const billData = {
        billReference: 'WORKFLOW-001',
        billDate: '2024-01-15',
        assignedToId: user.id
      }

      const createdBill = await createBill(billData)

      expect(createdBill.billReference).toBe('WORKFLOW-001')
      expect(createdBill.assignedToId).toBe(user.id)

      // Step 3: Verify bill appears in bills list
      const listResponse = await GET()
      const bills = await listResponse.json()

      expect(listResponse.status).toBe(200)
      const ourBill = bills.find((b: BillWithRelations) => b.billReference === 'WORKFLOW-001')
      expect(ourBill).toBeTruthy()
      expect(ourBill.assignedTo.id).toBe(user.id)

      // Step 4: Verify bill reference is no longer available
      const revalidateData = await validateBillReference('WORKFLOW-001')

      expect(revalidateData.isValid).toBe(false)
      expect(revalidateData.message).toBe('Bill reference already exists')
    })

    it('should handle bill creation with auto-assignment workflow', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Step 1: Create unassigned bill
      const billData = {
        billReference: 'AUTO-WORKFLOW-001',
        billDate: '2024-01-15'
        // No assignedToId - creating unassigned bill
      }

      const createdBill = await createBill(billData)

      expect(createdBill.assignedToId).toBeNull()

      // Verify bill stage is Draft by fetching from database
      const billFromDb = await testPrisma.bill.findUnique({
        where: { id: createdBill.id },
        include: { billStage: true }
      })
      expect(billFromDb!.billStage.label).toBe('Draft')

      // Step 2: Auto-assign the bill
      const assignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: createdBill.id
        })
      })

      const assignResponse = await assignPOST(assignRequest)
      const assignData = await assignResponse.json()

      expect(assignResponse.status).toBe(200)
      expect(assignData.message).toBe('Bill assigned successfully')
      expect(assignData.bill.assignedTo.id).toBe(user.id)

      // Step 3: Verify assignment persisted
      const verifyResponse = await GET()
      const verifyBills = await verifyResponse.json()
      const assignedBill = verifyBills.find((b: BillWithRelations) => b.billReference === 'AUTO-WORKFLOW-001')

      expect(assignedBill.assignedTo.id).toBe(user.id)
    })
  })

  describe('Bill Stage Progression Workflows', () => {
    it('should handle draft to submitted stage progression', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bill in Draft stage
      const draftBill = await createTestBill('STAGE-PROGRESS-001', 'Draft', user.id)

      // Verify initial stage
      let billFromDb = await testPrisma.bill.findUnique({
        where: { id: draftBill.id },
        include: { billStage: true }
      })
      expect(billFromDb!.billStage.label).toBe('Draft')
      expect(billFromDb!.submittedAt).toBeNull()

      // Progress to Submitted stage (simulated - would normally be done via separate API)
      const submittedStage = await testPrisma.billStage.findFirst({
        where: { label: 'Submitted' }
      })

      await testPrisma.bill.update({
        where: { id: draftBill.id },
        data: {
          billStageId: submittedStage!.id,
          submittedAt: new Date()
        }
      })

      // Verify stage progression
      billFromDb = await testPrisma.bill.findUnique({
        where: { id: draftBill.id },
        include: { billStage: true }
      })
      expect(billFromDb!.billStage.label).toBe('Submitted')
      expect(billFromDb!.submittedAt).toBeTruthy()
    })

    it('should track bill progression through all stages', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bill and progress through all stages
      const bill = await createTestBill('FULL-LIFECYCLE-001', 'Draft', user.id)

      const stages = ['Draft', 'Submitted', 'Approved', 'Paying', 'Paid']
      const timestamps = {
        submittedAt: null as Date | null,
        approvedAt: null as Date | null,
        onHoldAt: null as Date | null
      }

      for (let i = 0; i < stages.length; i++) {
        const stageName = stages[i]
        const stage = await testPrisma.billStage.findFirst({
          where: { label: stageName }
        })

        const updateData: Record<string, unknown> = { billStageId: stage!.id }

        // Set appropriate timestamps for each stage
        if (stageName === 'Submitted' && !timestamps.submittedAt) {
          updateData.submittedAt = new Date()
          timestamps.submittedAt = updateData.submittedAt as Date
        }
        if (stageName === 'Approved' && !timestamps.approvedAt) {
          updateData.approvedAt = new Date()
          timestamps.approvedAt = updateData.approvedAt as Date
        }

        await testPrisma.bill.update({
          where: { id: bill.id },
          data: updateData
        })

        // Verify stage update
        const updatedBill = await testPrisma.bill.findUnique({
          where: { id: bill.id },
          include: { billStage: true }
        })

        expect(updatedBill!.billStage.label).toBe(stageName)

        // Verify timestamps are preserved
        if (timestamps.submittedAt) {
          expect(updatedBill!.submittedAt).toBeTruthy()
        }
        if (timestamps.approvedAt) {
          expect(updatedBill!.approvedAt).toBeTruthy()
        }
      }

      // Final verification - bill should be in Paid stage
      const finalBill = await testPrisma.bill.findUnique({
        where: { id: bill.id },
        include: { billStage: true }
      })

      expect(finalBill!.billStage.label).toBe('Paid')
      expect(finalBill!.submittedAt).toBeTruthy()
      expect(finalBill!.approvedAt).toBeTruthy()
    })
  })

  describe('Multi-User Assignment Workflows', () => {
    it('should handle bill reassignment between users', async () => {
      const { users } = await getTestData()
      const user1 = users[0]
      const user2 = users[1]

      // Create bill assigned to user1
      const bill = await createTestBill('REASSIGN-001', 'Submitted', user1.id)

      // Verify initial assignment
      let billFromDb = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })
      expect(billFromDb!.assignedToId).toBe(user1.id)

      // Reassign to user2 (simulated - would normally be done via separate API)
      await testPrisma.bill.update({
        where: { id: bill.id },
        data: { assignedToId: user2.id }
      })

      // Verify reassignment
      billFromDb = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })
      expect(billFromDb!.assignedToId).toBe(user2.id)

      // Verify in API response
      const response = await GET()
      const bills = await response.json()
      const reassignedBill = bills.find((b: BillWithRelations) => b.billReference === 'REASSIGN-001')

      expect(reassignedBill.assignedTo.id).toBe(user2.id)
      expect(reassignedBill.assignedTo.name).toBe(user2.name)
    })

    it('should handle user assignment limits in workflow context', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create and assign 3 bills to reach the limit
      const bills = []
      for (let i = 1; i <= 3; i++) {
        const bill = await createTestBill(`LIMIT-BILL-${i}`, 'Draft', user.id)
        bills.push(bill)
      }

      // Verify user has 3 bills
      let userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(3)

      // Try to assign a 4th bill
      const fourthBill = await createTestBill('LIMIT-BILL-4', 'Submitted')

      const assignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: fourthBill.id
        })
      })

      const assignResponse = await assignPOST(assignRequest)
      const assignData = await assignResponse.json()

      expect(assignResponse.status).toBe(409)
      expect(assignData.error).toBe('User already has the maximum of 3 bills assigned')

      // Complete one bill (move to Paid stage) - bills in any stage count toward limit
      const paidStage = await testPrisma.billStage.findFirst({
        where: { label: 'Paid' }
      })

      await testPrisma.bill.update({
        where: { id: bills[0].id },
        data: { billStageId: paidStage!.id }
      })

      // User should still have 3 bills assigned (all stages count toward limit)
      userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(3)

      // Assignment should still fail due to 3-bill limit
      const retryAssignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: fourthBill.id
        })
      })

      const retryAssignResponse = await assignPOST(retryAssignRequest)
      const retryAssignData = await retryAssignResponse.json()

      expect(retryAssignResponse.status).toBe(409)
      expect(retryAssignData.error).toBe('User already has the maximum of 3 bills assigned')
    })
  })

  describe('Error Handling and Edge Cases in Workflows', () => {
    it('should handle duplicate bill reference in creation workflow', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create first bill
      const billData1 = {
        billReference: 'DUPLICATE-REF',
        billDate: '2024-01-15',
        assignedToId: user.id
      }

      await createBill(billData1)

      // Try to create second bill with same reference
      const billData2 = {
        billReference: 'DUPLICATE-REF',
        billDate: '2024-01-16',
        assignedToId: user.id
      }

      await expect(createBill(billData2)).rejects.toThrow('Bill reference already exists')

      // Verify only one bill exists
      const billCount = await testPrisma.bill.count({
        where: { billReference: 'DUPLICATE-REF' }
      })
      expect(billCount).toBe(1)
    })

    it('should handle assignment of non-existent bill', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const assignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: 'non-existent-bill-id'
        })
      })

      const assignResponse = await assignPOST(assignRequest)
      const assignData = await assignResponse.json()

      expect(assignResponse.status).toBe(404)
      expect(assignData.error).toBe('Bill not found')
    })

    it('should handle assignment to non-existent user', async () => {
      const bill = await createTestBill('ORPHAN-BILL', 'Submitted')

      const assignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'non-existent-user-id',
          billId: bill.id
        })
      })

      const assignResponse = await assignPOST(assignRequest)
      const assignData = await assignResponse.json()

      expect(assignResponse.status).toBe(404)
      expect(assignData.error).toBe('User not found')

      // Verify bill remains unassigned
      const billFromDb = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })
      expect(billFromDb!.assignedToId).toBeNull()
    })
  })

  describe('Complex Workflow Scenarios', () => {
    it('should handle multiple bills through complete lifecycle concurrently', async () => {
      const { users } = await getTestData()
      const user1 = users[0]
      const user2 = users[1]

      // Create multiple bills for different users
      const bills = [
        { ref: 'COMPLEX-001', user: user1 },
        { ref: 'COMPLEX-002', user: user2 },
        { ref: 'COMPLEX-003', user: user1 }
      ]

      // Create all bills concurrently
      const createPromises = bills.map(({ ref, user }) => {
        const billData = {
          billReference: ref,
          billDate: '2024-01-15',
          assignedToId: user.id
        }

        return createBill(billData)
      })

      const createdBills = await Promise.all(createPromises)

      // Verify all bills created successfully
      expect(createdBills.length).toBe(3)

      // Verify all bills exist in database
      const allBills = await testPrisma.bill.findMany({
        where: {
          billReference: { in: bills.map(b => b.ref) }
        },
        include: { assignedTo: true }
      })

      expect(allBills.length).toBe(3)

      // Verify correct assignments
      allBills.forEach(bill => {
        const expectedUser = bills.find(b => b.ref === bill.billReference)!.user
        expect(bill.assignedToId).toBe(expectedUser.id)
      })

      // Verify via API
      const listResponse = await GET()
      const apiBills = await listResponse.json()

      const ourBills = apiBills.filter((b: BillWithRelations) =>
        bills.map(bill => bill.ref).includes(b.billReference)
      )

      expect(ourBills.length).toBe(3)
      ourBills.forEach((bill: BillWithRelations) => {
        expect(bill.assignedTo).toBeTruthy()
        expect(bill.billStage.label).toBe('Draft')
      })
    })
  })
})