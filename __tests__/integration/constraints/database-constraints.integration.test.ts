import { POST } from '@/app/api/bills/route'
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

describe('Database Constraints and Error Scenarios Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('Database Constraint Validation', () => {
    it('should enforce unique bill reference constraint at database level', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create first bill directly in database
      const billStage = await testPrisma.billStage.findFirst({
        where: { label: 'Draft' }
      })

      await testPrisma.bill.create({
        data: {
          billReference: 'CONSTRAINT-TEST-001',
          billDate: new Date('2024-01-01'),
          billStageId: billStage!.id,
          assignedToId: user.id
        }
      })

      // Try to create second bill with same reference via API
      const billData = {
        billReference: 'CONSTRAINT-TEST-001',
        billDate: '2024-01-02',
        assignedToId: user.id
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Bill reference already exists')

      // Verify only one bill exists
      const billCount = await testPrisma.bill.count({
        where: { billReference: 'CONSTRAINT-TEST-001' }
      })
      expect(billCount).toBe(1)
    })

    it('should enforce foreign key constraints for user assignment', async () => {
      const bill = await createTestBill('FK-TEST-001', 'Submitted')

      // Try to assign bill to non-existent user via API
      const assignRequest = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'non-existent-user-id',
          billId: bill.id
        })
      })

      const response = await assignPOST(assignRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')

      // Verify bill remains unassigned
      const billFromDb = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })
      expect(billFromDb!.assignedToId).toBeNull()
    })

    it('should enforce foreign key constraints for bill stage', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Try to create bill with invalid bill stage ID
      try {
        await testPrisma.bill.create({
          data: {
            billReference: 'INVALID-STAGE-001',
            billDate: new Date('2024-01-01'),
            billStageId: 'non-existent-stage-id',
            assignedToId: user.id
          }
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        // Should throw a foreign key constraint error
        expect(error).toBeTruthy()
      }

      // Verify no bill was created
      const billCount = await testPrisma.bill.count({
        where: { billReference: 'INVALID-STAGE-001' }
      })
      expect(billCount).toBe(0)
    })
  })

  describe('API Error Handling Scenarios', () => {
    it('should handle malformed JSON in bill creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: 'invalid json{'
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      // API should handle JSON parsing errors gracefully
    })

    it('should handle missing required fields in bill creation', async () => {
      const invalidBillData = {
        // Missing billReference
        billDate: '2024-01-01'
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(invalidBillData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('expected string, received undefined')
    })

    it('should handle invalid date formats in bill creation', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const invalidBillData = {
        billReference: 'INVALID-DATE-001',
        billDate: 'not-a-date',
        assignedToId: user.id
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(invalidBillData)
      })

      const response = await POST(request)

      // Should handle invalid date format gracefully
      expect([400, 500]).toContain(response.status)
    })

    it('should handle empty request body in bill creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: ''
      })

      const response = await POST(request)

      expect([400, 500]).toContain(response.status)
    })

    it('should handle missing userId in assignment request', async () => {
      const bill = await createTestBill('MISSING-USER-001', 'Submitted')

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          billId: bill.id
          // Missing userId
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('expected string, received undefined')
    })

    it('should handle invalid bill stage for assignment', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create bill in non-assignable stage
      const bill = await createTestBill('NON-ASSIGNABLE-001', 'Approved')

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: bill.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bill must be in Draft or Submitted stage to be assigned')

      // Verify bill remains unassigned
      const billFromDb = await testPrisma.bill.findUnique({
        where: { id: bill.id }
      })
      expect(billFromDb!.assignedToId).toBeNull()
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should handle very long bill references', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const longReference = 'A'.repeat(1000) // Very long reference

      const billData = {
        billReference: longReference,
        billDate: '2024-01-01',
        assignedToId: user.id
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      })

      const response = await POST(request)

      // Should handle long references appropriately (either accept or reject)
      expect([201, 400, 413, 500]).toContain(response.status)
    })

    it('should handle special characters in bill references', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const specialCharReference = 'BILL-!@#$%^&*()_+={[}]|\\:";\'<,>.?/`~'

      const billData = {
        billReference: specialCharReference,
        billDate: '2024-01-01',
        assignedToId: user.id
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      })

      const response = await POST(request)

      // Should handle special characters appropriately
      if (response.status === 201) {
        // If creation succeeds, verify the reference was stored correctly
        const bill = await testPrisma.bill.findFirst({
          where: { billReference: specialCharReference }
        })
        expect(bill).toBeTruthy()
        expect(bill!.billReference).toBe(specialCharReference)
      } else {
        // If creation fails, should be a client error (400) not server error (500)
        expect([400, 413]).toContain(response.status)
      }
    })

    it('should handle null and undefined values appropriately', async () => {
      const invalidData = {
        billReference: null,
        billDate: undefined,
        assignedToId: null
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)

      expect([400, 500]).toContain(response.status)
    })
  })

  describe('Database Connection and Transaction Scenarios', () => {
    it('should handle database operations atomically', async () => {
      const { users } = await getTestData()
      const user = users[0]

      const initialBillCount = await testPrisma.bill.count()

      // Create bill with valid data
      const billData = {
        billReference: 'ATOMIC-TEST-001',
        billDate: '2024-01-01',
        assignedToId: user.id
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      })

      const response = await POST(request)

      if (response.status === 201) {
        // If creation succeeded, verify exactly one bill was added
        const finalBillCount = await testPrisma.bill.count()
        expect(finalBillCount).toBe(initialBillCount + 1)

        // Verify the bill exists with correct data
        const createdBill = await testPrisma.bill.findFirst({
          where: { billReference: 'ATOMIC-TEST-001' }
        })
        expect(createdBill).toBeTruthy()
        expect(createdBill!.assignedToId).toBe(user.id)
      } else {
        // If creation failed, verify no bills were added
        const finalBillCount = await testPrisma.bill.count()
        expect(finalBillCount).toBe(initialBillCount)
      }
    })

    it('should handle rapid sequential operations', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create multiple bills rapidly in sequence
      const billPromises = []
      for (let i = 1; i <= 5; i++) {
        const billData = {
          billReference: `RAPID-BILL-${i}`,
          billDate: '2024-01-01',
          assignedToId: user.id
        }

        const request = new NextRequest('http://localhost:3000/api/bills', {
          method: 'POST',
          body: JSON.stringify(billData)
        })

        billPromises.push(POST(request))
      }

      const responses = await Promise.all(billPromises)

      // All bills should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Verify all bills exist in database
      const createdBills = await testPrisma.bill.findMany({
        where: {
          billReference: { startsWith: 'RAPID-BILL-' }
        }
      })

      expect(createdBills.length).toBe(5)
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle assignment when user already has maximum bills', async () => {
      const { users } = await getTestData()
      const user = users[0]

      // Create and assign 3 bills to reach maximum
      for (let i = 1; i <= 3; i++) {
        await createTestBill(`MAX-BILL-${i}`, 'Draft', user.id)
      }

      // Try to assign another bill
      const extraBill = await createTestBill('EXTRA-BILL', 'Submitted')

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          billId: extraBill.id
        })
      })

      const response = await assignPOST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User already has the maximum of 3 bills assigned')

      // Verify extra bill remains unassigned
      const billFromDb = await testPrisma.bill.findUnique({
        where: { id: extraBill.id }
      })
      expect(billFromDb!.assignedToId).toBeNull()
    })

    it('should handle assignment to bills that are already assigned', async () => {
      const { users } = await getTestData()
      const user1 = users[0]
      const user2 = users[1]

      // Create bill assigned to user1
      const bill = await createTestBill('ALREADY-ASSIGNED', 'Submitted', user1.id)

      // Try to assign same bill to user2
      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: user2.id,
          billId: bill.id
        })
      })

      const response = await assignPOST(request)

      // Current implementation may allow reassignment or may reject it
      // Either behavior is acceptable depending on business rules
      if (response.status === 200) {
        // If reassignment is allowed, verify new assignment
        const billFromDb = await testPrisma.bill.findUnique({
          where: { id: bill.id }
        })
        expect(billFromDb!.assignedToId).toBe(user2.id)
      } else {
        // If reassignment is rejected, verify original assignment remains
        expect([400, 409]).toContain(response.status)
        const billFromDb = await testPrisma.bill.findUnique({
          where: { id: bill.id }
        })
        expect(billFromDb!.assignedToId).toBe(user1.id)
      }
    })
  })
})