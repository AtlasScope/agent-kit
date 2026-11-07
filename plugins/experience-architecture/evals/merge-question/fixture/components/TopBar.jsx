'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/overview', label: 'Overview' },
  { href: '/customers', label: 'Customers' },
  { href: '/orders', label: 'Orders' },
  { href: '/reports', label: 'Reports' },
];

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <strong>Northwind</strong>
      <nav aria-label="Primary">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'active' : ''}>{l.label}</Link>
        ))}
      </nav>
      <input type="search" aria-label="Search" placeholder="Search…" />
      <Link href="/admin/users">Admin</Link>
    </header>
  );
}
