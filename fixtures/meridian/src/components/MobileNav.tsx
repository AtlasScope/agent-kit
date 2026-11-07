"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_NAV } from "@/lib/nav";
import type { Workspace } from "@/lib/data";

export function MobileNav({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="mobile-bar">
        <button className="btn" onClick={() => setOpen(true)} aria-label="Open menu">
          Menu
        </button>
        <strong>{workspace.name}</strong>
        <Link href="/inbox" className="btn btn-ghost">
          Inbox
        </Link>
      </div>
      <div className={`mobile-drawer${open ? " open" : ""}`} onClick={() => setOpen(false)}>
        <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Menu</strong>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {MOBILE_NAV.map((item) => {
            const href = `/w/${workspace.slug}${item.path}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={item.key} href={href} className={`mobile-link${active ? " active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
          <Link href="/workspaces" className="mobile-link">
            Switch workspace
          </Link>
          <Link href="/org" className="mobile-link">
            Organization
          </Link>
          <Link href="/account/profile" className="mobile-link">
            Account
          </Link>
          <Link href="/logout" className="mobile-link">
            Sign out
          </Link>
        </div>
      </div>
    </>
  );
}
