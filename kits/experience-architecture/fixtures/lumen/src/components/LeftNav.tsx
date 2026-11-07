'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { primaryNav } from '~/lib/nav';

export default function LeftNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="navlist">
        {primaryNav.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
