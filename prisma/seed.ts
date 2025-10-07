import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const billStageData = [
  { label: 'Draft' },
  { label: 'Submitted' },
  { label: 'Approved' },
  { label: 'Paying' },
  { label: 'On Hold' },
  { label: 'Rejected' },
  { label: 'Paid' }
]

const generateRandomUsers = (count: number) => {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rose', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']
  
  const users = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    
    users.push({
      name: `${firstName} ${lastName}`,
      email: email
    })
  }
  return users
}

const generateRandomBills = (count: number, userIds: string[], billStageIds: string[]) => {
  const bills = []
  const userBillCounts = new Map<string, number>()

  for (let i = 0; i < count; i++) {
    const billDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
    const billReference = `BILL-${String(i + 1).padStart(4, '0')}`
    const randomStageIndex = Math.floor(Math.random() * billStageIds.length)
    const stageId = billStageIds[randomStageIndex]
    const stageName = billStageData[randomStageIndex].label

    // Assign to user while respecting 3-bill limit
    let assignedToId = null
    if (!['Draft', 'Submitted'].includes(stageName)) {
      // Find a user with fewer than 3 bills
      const availableUsers = userIds.filter(id => (userBillCounts.get(id) || 0) < 3)
      if (availableUsers.length > 0) {
        assignedToId = availableUsers[Math.floor(Math.random() * availableUsers.length)]
        userBillCounts.set(assignedToId, (userBillCounts.get(assignedToId) || 0) + 1)
      }
    }
    
    // Generate stage-specific timestamps
    let submittedAt = null
    let approvedAt = null
    let onHoldAt = null
    
    if (['Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid'].includes(stageName)) {
      submittedAt = new Date(billDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // 0-7 days after bill date
    }
    
    if (['Approved', 'Paying', 'Paid'].includes(stageName)) {
      approvedAt = new Date(submittedAt!.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) // 0-5 days after submission
    }
    
    if (stageName === 'On Hold') {
      onHoldAt = new Date(submittedAt!.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000) // 0-10 days after submission
    }
    
    bills.push({
      billReference,
      billDate,
      submittedAt,
      approvedAt,
      onHoldAt,
      billStageId: stageId,
      assignedToId
    })
  }
  
  return bills
}

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.bill.deleteMany()
  await prisma.user.deleteMany()
  await prisma.billStage.deleteMany()

  // Seed bill stages
  console.log('Seeding bill stages...')
  const createdBillStages = await prisma.billStage.createManyAndReturn({
    data: billStageData
  })
  console.log(`Created ${createdBillStages.length} bill stages`)

  // Seed users
  console.log('Seeding users...')
  const userData = generateRandomUsers(50)
  const createdUsers = await prisma.user.createManyAndReturn({
    data: userData
  })
  console.log(`Created ${createdUsers.length} users`)

  // Seed bills
  console.log('Seeding bills...')
  const billData = generateRandomBills(50, createdUsers.map(u => u.id), createdBillStages.map(bs => bs.id))
  const createdBills = await prisma.bill.createMany({
    data: billData
  })
  console.log(`Created ${createdBills.count} bills`)

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })