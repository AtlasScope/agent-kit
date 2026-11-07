"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/types";
import { NAV_ITEMS, SECONDARY_ITEMS, visibleFor } from "./nav";

const PRIMARY = ["/today", "/schedule", "/patients", "/messages"];
const MORE = ["/intake", "/insurance", "/notes", "/settings", "/help"];

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const all = visibleFor(role, [...NAV_ITEMS, ...SECONDARY_ITEMS]);
  const primary = all.filter((i) => PRIMARY.includes(i.href));
  const more = all.filter((i) => MORE.includes(i.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {open && (
        <div className="more-sheet" role="dialog" aria-label="More destinations">
          <ul>
            {more.map((item) => (
              <li key={item.href}><Link href={item.href} className="nav-link">{item.label}</Link></li>
            ))}
          </ul>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
      <nav className="mobile-nav" aria-label="Main">
        {primary.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "tab active" : "tab"}>{item.short}</Link>
          );
        })}
        <button type="button" className={open ? "tab active" : "tab"} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          More
        </button>
      </nav>
    </>
  );
}
