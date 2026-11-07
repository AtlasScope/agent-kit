"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { NAV_ITEMS, SECONDARY_ITEMS, visibleFor } from "./nav";

export function Sidebar({ role, unread }: { role: Role; unread: number }) {
  const pathname = usePathname();
  const items = visibleFor(role, NAV_ITEMS);

  return (
    <nav className="sidebar" aria-label="Main">
      <ul>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link href={item.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
                {item.label}
                {item.href === "/messages" && unread > 0 && <span className="badge">{unread}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="sidebar-secondary">
        {SECONDARY_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link href={item.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>{item.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
