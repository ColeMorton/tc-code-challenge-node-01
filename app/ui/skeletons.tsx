import React from 'react'

// Loading animation
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

// Composable skeleton components
interface SkeletonProps {
  className?: string
  height?: string
}

export const SkeletonLine: React.FC<SkeletonProps> = ({ className, height = 'h-4' }) => (
  <div className={`${shimmer} bg-gray-200 rounded ${height} ${className}`} />
)

export const SkeletonCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={`${shimmer} bg-gray-100 rounded-lg p-4 ${className}`}>
    {children}
  </div>
)

export const CardSkeleton: React.FC = () => (
  <div className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 p-2 shadow-sm`}>
    <div className="flex p-4">
      <SkeletonLine className="w-5 h-5 rounded-md" />
      <SkeletonLine className="ml-2 w-16 h-6 rounded-md" />
    </div>
    <div className="flex items-center justify-center truncate rounded-xl bg-white px-4 py-8">
      <SkeletonLine className="w-20 h-7 rounded-md" />
    </div>
  </div>
)

export const CardsSkeleton: React.FC = () => {
  return (
    <>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </>
  );
}

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className={`${shimmer} relative overflow-hidden w-full border-b border-gray-100 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg`}>
      {/* Customer Name and Image */}
      <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100"></div>
          <div className="h-6 w-24 rounded bg-gray-100"></div>
        </div>
      </td>
      {/* Email */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-32 rounded bg-gray-100"></div>
      </td>
      {/* Amount */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </td>
      {/* Date */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </td>
      {/* Status */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </td>
      {/* Actions */}
      <td className="whitespace-nowrap py-3 pl-6 pr-3">
        <div className="flex justify-end gap-3">
          <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
          <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
        </div>
      </td>
    </tr>
  );
}

export const BillsTableSkeleton: React.FC = () => {
  return (
    <div className={`${shimmer} relative overflow-hidden mt-6 flow-root`}>
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Status
                </th>
                <th
                  scope="col"
                  className="relative pb-4 pl-3 pr-6 pt-2 sm:pr-6"
                >
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const BillCardSkeleton: React.FC = () => (
  <div className={`${shimmer} relative overflow-hidden bg-gray-50 border border-gray-200 rounded-lg p-3`}>
    <SkeletonLine className="w-20 h-5 rounded-md mb-2" />
    <div className="space-y-1">
      <SkeletonLine className="w-24 h-4 rounded" />
      <SkeletonLine className="w-16 h-4 rounded" />
      <SkeletonLine className="w-20 h-4 rounded" />
    </div>
    <div className="mt-3 pt-3 border-t border-gray-200">
      <SkeletonLine className="w-full h-6 rounded" />
    </div>
  </div>
)

export const BillsDashboardSkeleton: React.FC = () => {
  const stageOrder = ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid']
  
  return (
    <div 
      data-testid="bills-grid" 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6"
    >
      {stageOrder.map((stageLabel) => (
        <div 
          key={stageLabel} 
          className={`${shimmer} relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200`}
        >
          <div className="px-4 py-3 rounded-t-lg border-b border-gray-200 bg-gray-300">
            <div className="h-6 w-24 rounded-md bg-gray-200 mx-auto" />
          </div>
          <div className="p-4 space-y-3 min-h-[400px]">
            <BillCardSkeleton />
            <BillCardSkeleton />
            <BillCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

export const BillFormSkeleton: React.FC = () => (
  <SkeletonCard className="bg-white py-8 px-6 shadow rounded-lg">
    <div className="space-y-6">
      {/* Error message skeleton */}
      <SkeletonLine className="h-12 w-full rounded-md" />
      
      {/* Bill Reference field skeleton */}
      <div>
        <SkeletonLine className="w-32 h-4 rounded mb-2" />
        <SkeletonLine className="w-full h-10 rounded-md" />
        <SkeletonLine className="w-48 h-4 rounded mt-1" />
      </div>
      
      {/* Bill Date field skeleton */}
      <div>
        <SkeletonLine className="w-24 h-4 rounded mb-2" />
        <SkeletonLine className="w-full h-10 rounded-md" />
        <SkeletonLine className="w-36 h-4 rounded mt-1" />
      </div>
      
      {/* Assigned To field skeleton */}
      <div>
        <SkeletonLine className="w-40 h-4 rounded mb-2" />
        <SkeletonLine className="w-full h-10 rounded-md" />
        <SkeletonLine className="w-56 h-4 rounded mt-1" />
      </div>
      
      {/* Button group skeleton */}
      <div className="flex space-x-4">
        <SkeletonLine className="h-10 flex-1 rounded-md" />
        <SkeletonLine className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  </SkeletonCard>
)
