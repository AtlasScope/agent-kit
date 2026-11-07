'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { settingsNav } from '~/lib/nav';

export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="subnav">
      {settingsNav.map((item) => (
        <Link key={item.key} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
