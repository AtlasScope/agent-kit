'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const parts = usePathname().split('/').filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: 13, marginBottom: 8 }}>
      <Link href="/overview">Home</Link>
      {parts.map((p, i) => (
        <span key={i}> / <Link href={'/' + parts.slice(0, i + 1).join('/')}>{p}</Link></span>
      ))}
    </nav>
  );
}
