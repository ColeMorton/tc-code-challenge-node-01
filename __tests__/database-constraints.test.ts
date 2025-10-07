/**
 * Database Constraints Test Suite
 * Tests the corrected database triggers for bill assignment limits
 */

import { prisma } from '@/app/lib/prisma'

describe('Database Constraints - Bill Assignment Limits', () => {
  let testUser: { id: string; name: string; email: string }
  let testUser2: { id: string; name: string; email: string }
  let draftStage: { id: string; label: string }
  let submittedStage: { id: string; label: string }
  let rejectedStage: { id: string; label: string }
  let paidStage: { id: string; label: string }

  beforeAll(async () => {
    // Create test users
    testUser = await prisma.user.create({
      data: {
        name: 'Test User 1',
        email: 'testuser1@example.com'
      }
    })

    testUser2 = await prisma.user.create({
      data: {
        name: 'Test User 2', 
        email: 'testuser2@example.com'
      }
    })

    // Create test bill stages
    draftStage = await prisma.billStage.create({
      data: {
        label: 'Draft',
        colour: '#6B7280'
      }
    })

    submittedStage = await prisma.billStage.create({
      data: {
        label: 'Submitted',
        colour: '#3B82F6'
      }
    })

    rejectedStage = await prisma.billStage.create({
      data: {
        label: 'Rejected',
        colour: '#EF4444'
      }
    })

    paidStage = await prisma.billStage.create({
      data: {
        label: 'Paid',
        colour: '#10B981'
      }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.bill.deleteMany({
      where: {
        OR: [
          { assignedToId: testUser.id },
          { assignedToId: testUser2.id }
        ]
      }
    })

    await prisma.user.deleteMany({
      where: {
        id: { in: [testUser.id, testUser2.id] }
      }
    })

    await prisma.billStage.deleteMany({
      where: {
        id: { in: [draftStage.id, submittedStage.id, rejectedStage.id, paidStage.id] }
      }
    })
  })

  beforeEach(async () => {
    // Clean up bills before each test
    await prisma.bill.deleteMany({
      where: {
        OR: [
          { assignedToId: testUser.id },
          { assignedToId: testUser2.id }
        ]
      }
    })
  })

  describe('Active Stage Counting', () => {
    it('should allow assignment when user has bills in inactive stages', async () => {
      // Create bills in inactive stages (should not count toward limit)
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'REJECTED-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: rejectedStage.id
          },
          {
            billReference: 'PAID-001', 
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: paidStage.id
          }
        ]
      })

      // Should be able to assign 3 more bills in active stages
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'ACTIVE-001',
            billDate: new Date('2024-01-03'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'ACTIVE-002',
            billDate: new Date('2024-01-04'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          },
          {
            billReference: 'ACTIVE-003',
            billDate: new Date('2024-01-05'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Verify user has 5 total bills but only 3 in active stages
      const userBillCount = await prisma.bill.count({
        where: { assignedToId: testUser.id }
      })
      expect(userBillCount).toBe(5)

      const activeBillCount = await prisma.bill.count({
        where: {
          assignedToId: testUser.id,
          billStage: {
            label: { in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold'] }
          }
        }
      })
      expect(activeBillCount).toBe(3)
    })

    it('should prevent assignment when user has 3 bills in active stages', async () => {
      // Create 3 bills in active stages
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'ACTIVE-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'ACTIVE-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          },
          {
            billReference: 'ACTIVE-003',
            billDate: new Date('2024-01-03'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Attempting to assign a 4th bill should fail
      await expect(
        prisma.bill.create({
          data: {
            billReference: 'ACTIVE-004',
            billDate: new Date('2024-01-04'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        })
      ).rejects.toThrow('User already has 3 bills assigned in active stages')
    })
  })

  describe('Bill Assignment Updates', () => {
    it('should prevent assignment when target user has 3 active bills', async () => {
      // Create 3 bills for testUser
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          },
          {
            billReference: 'USER1-003',
            billDate: new Date('2024-01-03'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Create unassigned bill
      const unassignedBill = await prisma.bill.create({
        data: {
          billReference: 'UNASSIGNED-001',
          billDate: new Date('2024-01-04'),
          billStageId: draftStage.id
        }
      })

      // Attempting to assign to testUser should fail
      await expect(
        prisma.bill.update({
          where: { id: unassignedBill.id },
          data: { assignedToId: testUser.id }
        })
      ).rejects.toThrow('User already has 3 bills assigned in active stages')
    })

    it('should allow assignment when target user has less than 3 active bills', async () => {
      // Create 2 bills for testUser
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          }
        ]
      })

      // Create unassigned bill
      const unassignedBill = await prisma.bill.create({
        data: {
          billReference: 'UNASSIGNED-001',
          billDate: new Date('2024-01-04'),
          billStageId: draftStage.id
        }
      })

      // Should be able to assign to testUser
      const updatedBill = await prisma.bill.update({
        where: { id: unassignedBill.id },
        data: { assignedToId: testUser.id }
      })

      expect(updatedBill.assignedToId).toBe(testUser.id)
    })
  })

  describe('Bill Reassignment', () => {
    it('should prevent reassignment when target user has 3 active bills', async () => {
      // Create 3 bills for testUser
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          },
          {
            billReference: 'USER1-003',
            billDate: new Date('2024-01-03'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Create bill assigned to testUser2
      const billToReassign = await prisma.bill.create({
        data: {
          billReference: 'USER2-001',
          billDate: new Date('2024-01-04'),
          assignedToId: testUser2.id,
          billStageId: draftStage.id
        }
      })

      // Attempting to reassign to testUser should fail
      await expect(
        prisma.bill.update({
          where: { id: billToReassign.id },
          data: { assignedToId: testUser.id }
        })
      ).rejects.toThrow('Target user already has 3 bills assigned in active stages')
    })
  })

  describe('Stage Transitions', () => {
    it('should prevent stage transition when user would exceed limit', async () => {
      // Create 3 bills for testUser in Draft stage
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-003',
            billDate: new Date('2024-01-03'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Create a bill in Rejected stage for testUser
      const rejectedBill = await prisma.bill.create({
        data: {
          billReference: 'USER1-REJECTED',
          billDate: new Date('2024-01-04'),
          assignedToId: testUser.id,
          billStageId: rejectedStage.id
        }
      })

      // Attempting to move rejected bill to Draft should fail
      await expect(
        prisma.bill.update({
          where: { id: rejectedBill.id },
          data: { billStageId: draftStage.id }
        })
      ).rejects.toThrow('User already has 3 bills assigned in active stages')
    })

    it('should allow stage transition when user stays within limit', async () => {
      // Create 2 bills for testUser
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        ]
      })

      // Create a bill in Rejected stage for testUser
      const rejectedBill = await prisma.bill.create({
        data: {
          billReference: 'USER1-REJECTED',
          billDate: new Date('2024-01-04'),
          assignedToId: testUser.id,
          billStageId: rejectedStage.id
        }
      })

      // Should be able to move rejected bill to Draft
      const updatedBill = await prisma.bill.update({
        where: { id: rejectedBill.id },
        data: { billStageId: draftStage.id }
      })

      expect(updatedBill.billStageId).toBe(draftStage.id)
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent assignments correctly', async () => {
      // This test would require more sophisticated setup to test true concurrency
      // For now, we test the constraint logic
      
      // Create 2 bills for testUser
      await prisma.bill.createMany({
        data: [
          {
            billReference: 'USER1-001',
            billDate: new Date('2024-01-01'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          },
          {
            billReference: 'USER1-002',
            billDate: new Date('2024-01-02'),
            assignedToId: testUser.id,
            billStageId: submittedStage.id
          }
        ]
      })

      // Should be able to assign one more bill
      const newBill = await prisma.bill.create({
        data: {
          billReference: 'USER1-003',
          billDate: new Date('2024-01-03'),
          assignedToId: testUser.id,
          billStageId: draftStage.id
        }
      })

      expect(newBill.assignedToId).toBe(testUser.id)

      // But not a second one
      await expect(
        prisma.bill.create({
          data: {
            billReference: 'USER1-004',
            billDate: new Date('2024-01-04'),
            assignedToId: testUser.id,
            billStageId: draftStage.id
          }
        })
      ).rejects.toThrow('User already has 3 bills assigned in active stages')
    })
  })
})
