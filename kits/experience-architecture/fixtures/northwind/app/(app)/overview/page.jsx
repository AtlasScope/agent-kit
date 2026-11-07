import Link from 'next/link';
import { orders, customers } from '@/lib/data';

export default function OverviewPage() {
  return (
    <>
      <h1>Overview</h1>
      <p>{customers.length} customers, {orders.filter((o) => o.status === 'open').length} open orders.</p>
      <ul>
        <li><Link href="/orders">Review open orders</Link></li>
        <li><Link href="/reports">Monthly revenue report</Link></li>
        <li><Link href="/settings/billing">Billing settings</Link></li>
      </ul>
    </>
  );
}
