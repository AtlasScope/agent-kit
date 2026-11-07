import Link from 'next/link';
import { team } from '@/lib/data';

export default function AdminUsersPage() {
  return (
    <>
      <h1>Users</h1>
      <ul>{team.map((m) => <li key={m.name}>{m.name} — {m.role}</li>)}</ul>
      <Link href="/account/billing">Billing &amp; invoices</Link>
    </>
  );
}
