import {
  fetchTotalNumberSubmittedBills,
  fetchTotalNumberApprovedBills,
  fetchTotalNumberOnHoldBills
} from '@/app/lib/domain/bills';

export default async function CardWrapper(): Promise<React.JSX.Element> {
  const [
    totalSubmittedBills,
    totalApprovedBills,
    totalOnHoldBills
  ] = await Promise.all([
    fetchTotalNumberSubmittedBills(),
    fetchTotalNumberApprovedBills(),
    fetchTotalNumberOnHoldBills()
  ])

  return (
    <>
      <Card title="Total number submitted bills" value={totalSubmittedBills} />
      <Card title="Total number approved bills" value={totalApprovedBills} />
      <Card title="Total number on hold bills" value={totalOnHoldBills} />
    </>
  );
}

export function Card({
  title,
  value
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl bg-gray-100 p-2 shadow-sm">
      <div className="flex p-4">
        <h3 className="ml-2 text-sm font-bold">{title}</h3>
      </div>
      <p className='truncate rounded-xl bg-white px-4 py-8 text-center text-2xl'>
        {value}
      </p>
    </div>
  );
}
