'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/overview', label: 'Overview' },
  { href: '/customers', label: 'Customers' },
  { href: '/orders', label: 'Orders' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings/profile', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sidebar" aria-label="Sidebar">
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} aria-current={pathname === item.href ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
      <hr />
      <Link href="/settings/team">Team</Link>
      <Link href="/settings/billing">Billing</Link>
    </nav>
  );
}
