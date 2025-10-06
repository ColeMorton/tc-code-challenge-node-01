import Link from 'next/link'
import { getBills } from '@/app/lib/getBills'
import { getUsers } from '@/app/lib/getUsers'
import BillsDashboard from './bills-dashboard'

export default async function BillsPage() {
  const [bills, users] = await Promise.all([
    getBills(),
    getUsers()
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
