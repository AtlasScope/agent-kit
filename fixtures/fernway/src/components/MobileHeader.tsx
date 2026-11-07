import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mobileNav } from '@/config/nav';

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-header">
      <span className="brand">Fernway</span>
      <button aria-expanded={open} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
        Menu
      </button>
      {open && (
        <nav className="mobile-menu" aria-label="Mobile">
          {mobileNav.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
