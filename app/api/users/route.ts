import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ERROR_DEFINITIONS } from '@/app/lib/error-constants'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_DEFINITIONS.FAILED_TO_FETCH_USERS.message },
      { status: ERROR_DEFINITIONS.FAILED_TO_FETCH_USERS.httpStatus }
    )
  }
}