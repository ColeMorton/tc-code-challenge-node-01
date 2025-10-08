import { Suspense } from 'react'
import { prisma } from '@/app/lib/infrastructure'
import BillForm from '@/app/ui/bills/form'
import { BillFormSkeleton } from '@/app/ui/skeletons'

async function BillFormWrapper(): Promise<React.JSX.Element> {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { bills: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <BillForm users={users} />
}

export default function NewBillPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 id="main-content" data-testid="new-bill-title" className="text-3xl font-bold text-gray-900">Create New Bill</h1>
          <p className="mt-2 text-gray-600">Add a new bill to the system</p>
        </header>

        <main>
          <Suspense fallback={<BillFormSkeleton />}>
            <BillFormWrapper />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
