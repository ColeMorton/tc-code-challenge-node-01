import { fetchUserBillsSummary } from '@/app/lib/data';

export default async function BillsTable() {
  const userSummary = await fetchUserBillsSummary();

  return (
    <div className="flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {userSummary?.map((user) => (
              <div
                key={user.userId}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <div className="mr-2 h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium">{user.userName}</p>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{user.totalBills}</p>
                      <p className="text-xs text-gray-500">Total Bills</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-600">{user.totalSubmitted}</p>
                      <p className="text-xs text-gray-500">Submitted</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-600">{user.totalApproved}</p>
                      <p className="text-xs text-gray-500">Approved</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-bold sm:pl-6">
                  User
                </th>
                <th scope="col" className="px-3 py-5 font-bold">
                  Total Bills
                </th>
                <th scope="col" className="px-3 py-5 font-bold">
                  Submitted
                </th>
                <th scope="col" className="px-3 py-5 font-bold">
                  Approved
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {userSummary?.map((user) => (
                <tr
                  key={user.userId}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium">{user.userName}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="font-semibold text-gray-900">{user.totalBills}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="font-semibold text-blue-600">{user.totalSubmitted}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="font-semibold text-green-600">{user.totalApproved}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
