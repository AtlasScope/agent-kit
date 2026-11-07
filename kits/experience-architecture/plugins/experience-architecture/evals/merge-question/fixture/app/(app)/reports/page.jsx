import { revenue, customers } from '@/lib/data';

export default function ReportsPage() {
  return (
    <>
      <h1>Reports</h1>
      <h2>Revenue by month</h2>
      <ul>{revenue.map((r) => <li key={r.month}>{r.month}: ${r.amount}</li>)}</ul>
      <h2>Top customers</h2>
      <ol>{customers.slice(0, 3).map((c) => <li key={c.id}>{c.name}</li>)}</ol>
    </>
  );
}
