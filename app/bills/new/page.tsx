import { prisma } from '@/app/lib/prisma'
import BillForm from '../../ui/bills/form'

export default async function NewBillPage() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 id="main-content" data-testid="new-bill-title" className="text-3xl font-bold text-gray-900">Create New Bill</h1>
          <p className="mt-2 text-gray-600">Add a new bill to the system</p>
        </header>

        <main>
          <BillForm users={users} />
        </main>
      </div>
    </div>
  )
}
