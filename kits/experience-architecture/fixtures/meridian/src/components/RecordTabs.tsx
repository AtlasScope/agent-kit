"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function RecordTabs({ base, tabs }: { base: string; tabs: { slug: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="tabs" aria-label="Record">
      {tabs.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? pathname === href || pathname.startsWith(href + "/") : pathname === base;
        return (
          <Link key={t.slug || "summary"} href={href} scroll={false} className={`tab${active ? " active" : ""}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
