import { Card } from '@/app/ui/dashboard/cards';
// import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
// import RevenueChart from '@/app/ui/dashboard/revenue-chart';
// import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import {
  BillsTableSkeleton,
  CardsSkeleton
 } from '@/app/ui/skeletons';
import CardWrapper from '@/app/ui/dashboard/cards';
import BillsTable from '@/app/ui/bills/table';

export default async function Page() {
  return (
    <main>
      <h1 className='mb-4 text-xl md:text-2xl text-center'>
        Bills
      </h1>
      <div className="px-12 py-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 [&>*:not(:last-child)]:pb-12 bg-gray-200">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
        <div className="col-span-full rounded-xl bg-gray-100 shadow-sm">
          <Suspense fallback={<BillsTableSkeleton />}>
            <BillsTable />
          </Suspense>
        </div>
      </div>
    </main>
  );
}