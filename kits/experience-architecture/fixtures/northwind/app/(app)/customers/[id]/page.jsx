'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { customers, orders } from '@/lib/data';
import { useNoteDraft } from '@/components/NoteDraft';

const TABS = ['overview', 'orders', 'notes'];

export default function CustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const tab = useSearchParams().get('tab') || 'overview';
  const { draft, setDraft } = useNoteDraft();
  const customer = customers.find((c) => c.id === id);
  if (!customer) return <h1>Customer not found</h1>;
  const next = customers[(customers.indexOf(customer) + 1) % customers.length];
  return (
    <>
      <h1>{customer.name}</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={t === tab} onClick={() => router.push(`/customers/${id}?tab=${t}`)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'overview' && <p>Plan: {customer.plan}. <Link href={`/customer-activity?id=${id}`}>View activity</Link></p>}
      {tab === 'orders' && (
        <ul>{orders.filter((o) => o.customerId === id).map((o) => <li key={o.id}><Link href={`/orders/${o.id}`}>Order {o.id}</Link></li>)}</ul>
      )}
      {tab === 'notes' && (
        <label>Note draft<textarea aria-label="Note draft" value={draft} onChange={(e) => setDraft(e.target.value)} /></label>
      )}
      <p><Link href={`/customers/${id}/notes`}>All notes</Link> · <Link href={`/customers/${next.id}?tab=${tab}`}>Next customer →</Link></p>
    </>
  );
}
