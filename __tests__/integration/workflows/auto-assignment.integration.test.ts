import { POST as assignPOST } from '@/app/api/bills/assign/route'
import { resetDatabase, testPrisma, getTestData, createTestBill, cleanupTestDatabase } from '../testUtils'
import { NextRequest } from 'next/server'

// Mock the main prisma instance to use our test database
jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { testPrisma } = require('../testUtils')
  return {
    prisma: testPrisma
  }
})

afterAll(async () => {
  await cleanupTestDatabase()
})

describe('Auto-Assignment Workflow Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('Auto-Assignment Priority and Selection', () => {
    it('should successfully auto-assign an available bill', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create available bills
      await createTestBill('DRAFT-001', 'Draft')
      await createTestBill('SUBMITTED-001', 'Submitted')

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Bill assigned successfully')
      expect(data.bill).toHaveProperty('id')
      expect(data.bill).toHaveProperty('assignedTo')
      expect(data.bill.assignedTo.id).toBe(user.id)

      // Verify a bill was assigned to the user
      const userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(1)
    })

    it('should auto-assign from available bills only', async () => {
      const { users } = await getTestData()
      const user1 = users[0]
      const user2 = users[1]

      // Create bills - some assigned, some unassigned
      const assignedBill = await createTestBill('ASSIGNED-BILL', 'Submitted')
      const unassignedBill1 = await createTestBill('UNASSIGNED-1', 'Draft')
      const unassignedBill2 = await createTestBill('UNASSIGNED-2', 'Submitted')

      // Assign one bill to another user
      await testPrisma.bill.update({
        where: { id: assignedBill.id },
        data: { assignedToId: user2.id }
      })

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user1.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Should assign one of the unassigned bills, not the already assigned one
      expect([unassignedBill1.id, unassignedBill2.id]).toContain(data.bill.id)
      expect(data.bill.id).not.toBe(assignedBill.id)

      // Verify user1 has 1 bill assigned
      const user1BillCount = await testPrisma.bill.count({
        where: { assignedToId: user1.id }
      })
      expect(user1BillCount).toBe(1)

      // Verify user2 still has 1 bill assigned
      const user2BillCount = await testPrisma.bill.count({
        where: { assignedToId: user2.id }
      })
      expect(user2BillCount).toBe(1)
    })

    it('should set submittedAt timestamp for submitted bills without one', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create a submitted bill without submittedAt timestamp
      const bill = await createTestBill('SUBMITTED-NO-TIMESTAMP', 'Submitted')

      // Ensure it doesn't have submittedAt
      await testPrisma.bill.update({
        where: { id: bill.id },
        data: { submittedAt: null }
      })

      const beforeAssignment = new Date()

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const afterAssignment = new Date()

      expect(response.status).toBe(200)

      // Verify submittedAt was set
      const assignedBill = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })

      expect(assignedBill!.submittedAt).toBeTruthy()
      expect(assignedBill!.submittedAt!.getTime() >= beforeAssignment.getTime()).toBe(true)
      expect(assignedBill!.submittedAt!.getTime() <= afterAssignment.getTime()).toBe(true)
    })

    it('should not modify submittedAt if already set', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const originalSubmittedAt = new Date('2024-01-01')

      // Create a submitted bill with existing submittedAt
      const bill = await createTestBill('SUBMITTED-WITH-TIMESTAMP', 'Submitted')
      await testPrisma.bill.update({
        where: { id: bill.id },
        data: { submittedAt: originalSubmittedAt }
      })

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)

      expect(response.status).toBe(200)

      // Verify submittedAt was not modified
      const assignedBill = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })

      expect(assignedBill!.submittedAt!.getTime()).toBe(originalSubmittedAt.getTime())
    })
  })

  describe('Auto-Assignment Limits and Constraints', () => {
    it('should respect 3-bill limit for auto-assignment', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bills and assign 3 to the user
      for (let i = 1; i <= 3; i++) {
        const bill = await createTestBill(`EXISTING-${i}`, 'Draft')
        await testPrisma.bill.update({
          where: { id: bill.id },
          data: { assignedToId: user.id }
        })
      }

      // Create unassigned bill for auto-assignment attempt
      await createTestBill('AVAILABLE-BILL', 'Submitted')

      // Try auto-assignment when user already has 3 bills
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User already has the maximum of 3 bills assigned')

      // Verify no additional assignment occurred
      const userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(3)
    })

    it('should handle auto-assignment when no assignable bills exist', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Clear all bills
      await testPrisma.bill.deleteMany()

      // Create bills in non-assignable stages
      await createTestBill('APPROVED-BILL', 'Approved')
      await createTestBill('PAID-BILL', 'Paid')

      // Try auto-assignment when no assignable bills exist
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No unassigned bills in Draft or Submitted stage found')
    })

    it('should only auto-assign bills in Draft or Submitted stages', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bills in various stages
      await createTestBill('APPROVED-BILL', 'Approved')
      await createTestBill('PAYING-BILL', 'Paying')
      await createTestBill('PAID-BILL', 'Paid')
      await createTestBill('REJECTED-BILL', 'Rejected')
      await createTestBill('ON-HOLD-BILL', 'On Hold')
      const assignableBill = await createTestBill('DRAFT-BILL', 'Draft')

      // Try auto-assignment
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bill.id).toBe(assignableBill.id) // Should only assign the Draft bill

      // Verify only the Draft bill was assigned
      const assignedBills = await testPrisma.bill.findMany({
        where: { assignedToId: user.id }
      })
      expect(assignedBills.length).toBe(1)
      expect(assignedBills[0].id).toBe(assignableBill.id)
    })
  })

  describe('Auto-Assignment Error Scenarios', () => {
    it('should handle invalid user ID for auto-assignment', async () => {
      await createTestBill('AVAILABLE-BILL', 'Submitted')

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'non-existent-user-id'
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should handle missing userId for auto-assignment', async () => {
      await createTestBill('AVAILABLE-BILL', 'Submitted')

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          // Missing userId
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('userId is required')
    })
  })

  describe('Auto-Assignment Workflow Edge Cases', () => {
    it('should handle auto-assignment with mixed bill stages', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bills in different assignable stages
      const draftBill = await createTestBill('DRAFT-BILL', 'Draft')
      const submittedBill = await createTestBill('SUBMITTED-BILL', 'Submitted')

      // Create non-assignable stage bills
      await createTestBill('APPROVED-BILL', 'Approved')
      await createTestBill('PAID-BILL', 'Paid')

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Should assign one of the assignable bills (Draft or Submitted)
      expect([draftBill.id, submittedBill.id]).toContain(data.bill.id)

      // Verify assignment
      const userBillCount = await testPrisma.bill.count({
        where: { assignedToId: user.id }
      })
      expect(userBillCount).toBe(1)

      // Verify non-assignable bills remain unassigned
      const nonAssignableBills = await testPrisma.bill.findMany({
        where: {
          billReference: { in: ['APPROVED-BILL', 'PAID-BILL'] }
        }
      })
      nonAssignableBills.forEach(bill => {
        expect(bill.assignedToId).toBeNull()
      })
    })

    it('should handle auto-assignment when all submitted bills are assigned', async () => {
      const { users } = await getTestData()
      const user1 = users[0]
      const user2 = users[1]

      // Create submitted bills and assign them to other users
      const submittedBill1 = await createTestBill('SUBMITTED-ASSIGNED-1', 'Submitted')
      const submittedBill2 = await createTestBill('SUBMITTED-ASSIGNED-2', 'Submitted')
      await testPrisma.bill.update({
        where: { id: submittedBill1.id },
        data: { assignedToId: user2.id }
      })
      await testPrisma.bill.update({
        where: { id: submittedBill2.id },
        data: { assignedToId: user2.id }
      })

      // Create unassigned draft bill
      const draftBill = await createTestBill('DRAFT-AVAILABLE', 'Draft')

      // Make auto-assignment request
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user1.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bill.id).toBe(draftBill.id) // Should fall back to draft bill

      // Verify assignment
      const assignedBill = await testPrisma.bill.findUnique({
        where: { id: draftBill.id }
      })
      expect(assignedBill!.assignedToId).toBe(user1.id)
    })
  })
})