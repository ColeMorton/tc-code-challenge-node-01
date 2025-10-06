/**
 * Database constraint utilities for bill assignment optimization
 * This file provides utilities to manage database constraints and triggers
 */

import { prisma } from './prisma'

/**
 * Apply database constraints and triggers for bill assignment optimization
 * This should be called during application startup or migration
 */
export async function applyDatabaseConstraints() {
  try {
    console.log('Applying database constraints and triggers...')
    
    // Read and execute the constraints SQL file
    const constraintsSQL = `
      -- Database constraints and triggers for bill assignment optimization
      
      -- 1. Create a view for user bill counts
      CREATE VIEW IF NOT EXISTS user_bill_counts AS
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(bill_counts.bill_count, 0) as bill_count,
        CASE 
          WHEN COALESCE(bill_counts.bill_count, 0) >= 3 THEN 1 
          ELSE 0 
        END as has_reached_limit,
        CASE 
          WHEN COALESCE(bill_counts.bill_count, 0) >= 3 THEN 0 
          ELSE 3 - COALESCE(bill_counts.bill_count, 0) 
        END as remaining_slots
      FROM users u
      LEFT JOIN (
        SELECT 
          assigned_to_id,
          COUNT(*) as bill_count
        FROM bills 
        WHERE assigned_to_id IS NOT NULL
          AND bill_stage_id IN (
            SELECT id FROM bill_stages 
            WHERE label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
          )
        GROUP BY assigned_to_id
      ) bill_counts ON u.id = bill_counts.assigned_to_id;

      -- 2. Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_bills_assigned_stage 
      ON bills(assigned_to_id, bill_stage_id) 
      WHERE assigned_to_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_bills_assignable 
      ON bills(id, bill_stage_id) 
      WHERE assigned_to_id IS NULL 
        AND bill_stage_id IN (
          SELECT id FROM bill_stages WHERE label IN ('Draft', 'Submitted')
        );

      -- 3. Create user assignment capacity view
      CREATE VIEW IF NOT EXISTS user_assignment_capacity AS
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(COUNT(b.id), 0) as current_assigned_count,
        (3 - COALESCE(COUNT(b.id), 0)) as available_slots,
        CASE 
          WHEN COALESCE(COUNT(b.id), 0) >= 3 THEN 'FULL' 
          WHEN COALESCE(COUNT(b.id), 0) >= 2 THEN 'NEARLY_FULL'
          ELSE 'AVAILABLE' 
        END as capacity_status
      FROM users u
      LEFT JOIN bills b ON u.id = b.assigned_to_id 
        AND b.bill_stage_id IN (
          SELECT id FROM bill_stages 
          WHERE label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
        )
      GROUP BY u.id, u.name, u.email;
    `

    // Execute the constraints SQL
    await prisma.$executeRawUnsafe(constraintsSQL)
    
    console.log('✅ Database constraints and triggers applied successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to apply database constraints:', error)
    return false
  }
}

/**
 * Get user assignment capacity information
 */
export async function getUserAssignmentCapacity(userId: string) {
  try {
    // Try to use the view first, fallback to direct query if view doesn't exist
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM user_assignment_capacity WHERE user_id = ?
      `, userId) as Array<{
        user_id: string
        user_name: string
        user_email: string
        current_assigned_count: number
        available_slots: number
        capacity_status: string
      }>

      if (result.length === 0) {
        return null
      }

      return {
        userId: result[0].user_id,
        userName: result[0].user_name,
        userEmail: result[0].user_email,
        currentAssignedCount: result[0].current_assigned_count,
        availableSlots: result[0].available_slots,
        capacityStatus: result[0].capacity_status
      }
    } catch {
      // Fallback to direct query if view doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      })

      if (!user) {
        return null
      }

      const billCount = await prisma.bill.count({
        where: { 
          assignedToId: userId,
          billStage: {
            label: { in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold'] }
          }
        }
      })

      const availableSlots = Math.max(0, 3 - billCount)
      const capacityStatus = billCount >= 3 ? 'FULL' : 
                           billCount >= 2 ? 'NEARLY_FULL' : 'AVAILABLE'

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        currentAssignedCount: billCount,
        availableSlots,
        capacityStatus
      }
    }
  } catch (error) {
    console.error('Failed to get user assignment capacity:', error)
    return null
  }
}

/**
 * Get all users with their assignment capacity
 */
export async function getAllUsersAssignmentCapacity() {
  try {
    // Try to use the view first, fallback to direct query if view doesn't exist
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM user_assignment_capacity ORDER BY current_assigned_count ASC, user_name ASC
      `) as Array<{
        user_id: string
        user_name: string
        user_email: string
        current_assigned_count: number
        available_slots: number
        capacity_status: string
      }>

      return result.map(row => ({
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        currentAssignedCount: row.current_assigned_count,
        availableSlots: row.available_slots,
        capacityStatus: row.capacity_status
      }))
    } catch {
      // Fallback to direct query if view doesn't exist
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
      })

      const result = await Promise.all(
        users.map(async (user) => {
          const billCount = await prisma.bill.count({
            where: { 
              assignedToId: user.id,
              billStage: {
                label: { in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold'] }
              }
            }
          })

          const availableSlots = Math.max(0, 3 - billCount)
          const capacityStatus = billCount >= 3 ? 'FULL' : 
                               billCount >= 2 ? 'NEARLY_FULL' : 'AVAILABLE'

          return {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            currentAssignedCount: billCount,
            availableSlots,
            capacityStatus
          }
        })
      )

      return result.sort((a, b) => {
        if (a.currentAssignedCount !== b.currentAssignedCount) {
          return a.currentAssignedCount - b.currentAssignedCount
        }
        return a.userName.localeCompare(b.userName)
      })
    }
  } catch (error) {
    console.error('Failed to get all users assignment capacity:', error)
    return []
  }
}

/**
 * Get assignable bills (unassigned bills in Draft or Submitted stage)
 */
export async function getAssignableBills() {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        assignedToId: null,
        billStage: {
          label: {
            in: ['Draft', 'Submitted']
          }
        }
      },
      include: {
        billStage: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return bills
  } catch (error) {
    console.error('Failed to get assignable bills:', error)
    return []
  }
}

/**
 * Get bills assigned to a specific user
 */
export async function getUserAssignedBills(userId: string) {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        assignedToId: userId,
        billStage: {
          label: {
            in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold']
          }
        }
      },
      include: {
        billStage: true,
        assignedTo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return bills
  } catch (error) {
    console.error('Failed to get user assigned bills:', error)
    return []
  }
}

/**
 * Validate if a user can be assigned a bill
 */
export async function canUserBeAssignedBill(userId: string): Promise<{
  canAssign: boolean
  reason?: string
  currentCount: number
  availableSlots: number
}> {
  try {
    const capacity = await getUserAssignmentCapacity(userId)
    
    if (!capacity) {
      return {
        canAssign: false,
        reason: 'User not found',
        currentCount: 0,
        availableSlots: 0
      }
    }

    if (capacity.currentAssignedCount >= 3) {
      return {
        canAssign: false,
        reason: 'User has reached maximum bill limit of 3',
        currentCount: capacity.currentAssignedCount,
        availableSlots: capacity.availableSlots
      }
    }

    return {
      canAssign: true,
      currentCount: capacity.currentAssignedCount,
      availableSlots: capacity.availableSlots
    }
  } catch (error) {
    console.error('Failed to validate user assignment:', error)
    return {
      canAssign: false,
      reason: 'Validation failed',
      currentCount: 0,
      availableSlots: 0
    }
  }
}
