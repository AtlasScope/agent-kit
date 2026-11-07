'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { customers } from '@/lib/data';

function CustomerList() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('selected');
  const selected = customers.find((c) => c.id === selectedId);
  return (
    <>
      <h1>Customers</h1>
      <table>
        <tbody>
          {customers.filter((c) => !c.archived).map((c) => (
            <tr key={c.id} onClick={() => router.replace(`/customers?selected=${c.id}`)} style={{ cursor: 'pointer' }}>
              <td>{c.name}</td><td>{c.plan}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <aside className="drawer" role="dialog" aria-label={`Customer ${selected.name}`}>
          <h2>{selected.name}</h2>
          <p>Plan: {selected.plan}</p>
          <Link href={`/customers/${selected.id}`}>Open full record</Link>
          <button onClick={() => router.replace('/customers')}>Close</button>
        </aside>
      )}
    </>
  );
}

export default function CustomersPage() {
  return <Suspense><CustomerList /></Suspense>;
}
