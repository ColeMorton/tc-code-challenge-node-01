import Link from 'next/link'
import { Suspense } from 'react'
import { getBills, getUsers } from '@/app/lib/domain/bills'
import BillsDashboard from '@/app/ui/bills/dashboard'
import { BillsDashboardSkeleton } from '@/app/ui/skeletons'

async function BillsDashboardWrapper(): Promise<React.JSX.Element> {
  const [bills, users] = await Promise.all([
    getBills(),
    getUsers()
  ])

  return <BillsDashboard bills={bills} users={users} />
}

export default function BillsPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 id="main-content" data-testid="dashboard-title" className="text-3xl font-bold text-gray-900">Bills Dashboard</h1>
          <Link
            href="/bills/new"
            data-testid="add-new-bill-button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Bill
          </Link>
        </header>

        <main>
          <Suspense fallback={<BillsDashboardSkeleton />}>
            <BillsDashboardWrapper />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
