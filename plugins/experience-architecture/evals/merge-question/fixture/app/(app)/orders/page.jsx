'use client';
import { useState } from 'react';
import Link from 'next/link';
import { orders } from '@/lib/data';

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const rows = orders.filter((o) => status === 'all' || o.status === status);
  return (
    <>
      <h1>Orders</h1>
      <div role="group" aria-label="Status filter">
        {['all', 'open', 'shipped', 'closed'].map((s) => (
          <button key={s} aria-pressed={s === status} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <table>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}><td><Link href={`/orders/${o.id}`}>Order {o.id}</Link></td><td>{o.status}</td><td>${o.total}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
