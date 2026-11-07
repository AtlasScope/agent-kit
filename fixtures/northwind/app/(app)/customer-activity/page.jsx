import { customers, orders } from '@/lib/data';

export default async function CustomerActivityPage({ searchParams }) {
  const { id } = await searchParams;
  const customer = customers.find((c) => c.id === id);
  return (
    <>
      <h1>Activity: {customer?.name ?? 'Unknown'}</h1>
      <ul>{orders.filter((o) => o.customerId === id).map((o) => <li key={o.id}>Order {o.id} — {o.status}</li>)}</ul>
    </>
  );
}
