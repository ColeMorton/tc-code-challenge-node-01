import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import BillsDashboard from './bills-dashboard'

export default async function BillsPage() {
  const [bills, users] = await Promise.all([
    prisma.bill.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        billStage: {
          select: {
            id: true,
            label: true,
            colour: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 data-testid="dashboard-title" className="text-3xl font-bold text-gray-900">Bills Dashboard</h1>
          <Link
            href="/bills/new"
            data-testid="add-new-bill-button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Add New Bill
          </Link>
        </div>

        <BillsDashboard bills={bills} users={users} />
      </div>
    </div>
  )
}
