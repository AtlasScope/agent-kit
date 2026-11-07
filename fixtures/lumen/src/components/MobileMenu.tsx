'use client';

import Link from 'next/link';
import { useState } from 'react';
import { primaryNav } from '~/lib/nav';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-only">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Menu
      </button>
      {open && (
        <nav aria-label="Mobile" className="mobile-panel">
          <ul className="navlist">
            {primaryNav.map((item) => (
              <li key={item.key}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
