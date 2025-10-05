import { POST as assignPOST } from '@/app/api/bills/assign/route'
import { resetDatabase, testPrisma, getTestData, createTestBill, cleanupTestDatabase } from '../integration/testUtils'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { testPrisma } = require('../integration/testUtils')
  return {
    prisma: testPrisma
  }
})

afterAll(async () => {
  await cleanupTestDatabase()
})

describe('Bill Assignment Race Condition Prevention', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should prevent assigning more than 3 bills via concurrent requests', async () => {
    const { users } = await getTestData()
    const testUser = users[0]

    const testBills = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createTestBill(`RACE-TEST-${Date.now()}-${i}`, 'Draft')
      )
    )

    const assignmentPromises = testBills.map(bill =>
      assignPOST(new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          billId: bill.id
        })
      }))
    )

    const responses = await Promise.all(assignmentPromises)
    const results = await Promise.all(
      responses.map(r => r.json())
    )

    const successfulAssignments = responses.filter(r => r.status === 200).length
    const rejectedAssignments = results.filter(
      r => r.error === 'User already has the maximum of 3 bills assigned'
    ).length

    expect(successfulAssignments).toBe(3)
    expect(rejectedAssignments).toBe(2)

    const finalCount = await testPrisma.bill.count({
      where: { assignedToId: testUser.id }
    })

    expect(finalCount).toBe(3)
  })

  it('should handle retry logic correctly under race conditions', async () => {
    const { users } = await getTestData()
    const testUser = users[0]

    const testBills = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        createTestBill(`RETRY-TEST-${Date.now()}-${i}`, 'Draft')
      )
    )

    await testPrisma.bill.update({
      where: { id: testBills[0].id },
      data: { assignedToId: testUser.id }
    })
    await testPrisma.bill.update({
      where: { id: testBills[1].id },
      data: { assignedToId: testUser.id }
    })

    const concurrentAssignments = [
      assignPOST(new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          billId: testBills[2].id
        })
      })),
      assignPOST(new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          billId: testBills[3].id
        })
      }))
    ]

    const responses = await Promise.all(concurrentAssignments)

    const successCount = responses.filter(r => r.status === 200).length
    expect(successCount).toBe(1)

    const finalCount = await testPrisma.bill.count({
      where: { assignedToId: testUser.id }
    })
    expect(finalCount).toBe(3)
  })
})
