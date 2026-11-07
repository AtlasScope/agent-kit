import Link from 'next/link';
import { customers } from '@/lib/data';

export default function ArchivePage() {
  return (
    <>
      <h1>Archived customers</h1>
      <ul>{customers.filter((c) => c.archived).map((c) => <li key={c.id}><Link href={`/customers/${c.id}`}>{c.name}</Link></li>)}</ul>
    </>
  );
}
