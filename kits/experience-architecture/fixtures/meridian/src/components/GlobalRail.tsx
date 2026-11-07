"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { RAIL_ITEMS, railSectionFor } from "@/lib/nav";
import { readCookie, LAST_WORKSPACE_COOKIE } from "@/lib/session";
import { DEFAULT_WORKSPACE } from "@/lib/data";
import { useEffect, useState } from "react";

export function GlobalRail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ workspace?: string }>();
  const [lastWs, setLastWs] = useState<string>(DEFAULT_WORKSPACE);

  useEffect(() => {
    setLastWs(readCookie(LAST_WORKSPACE_COOKIE) ?? DEFAULT_WORKSPACE);
  }, [pathname]);

  const ws = params.workspace ?? lastWs;
  const active = railSectionFor(pathname);

  return (
    <nav className="rail" aria-label="Global">
      <Link href="/workspaces" className="rail-logo" aria-label="Meridian home">
        M
      </Link>
      {RAIL_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href(ws)}
          className={`rail-item${active === item.key ? " active" : ""}`}
          aria-current={active === item.key ? "page" : undefined}
        >
          <span className="glyph">{item.short}</span>
          <span>{item.label.length > 9 ? item.label.slice(0, 8) + "." : item.label}</span>
        </Link>
      ))}
      <div className="rail-spacer" />
      <button className="rail-kbd" onClick={onOpenPalette} title="Command palette">
        ⌘K
      </button>
      <Link href="/logout" className="rail-item">
        <span className="glyph">⏻</span>
        <span>Sign out</span>
      </Link>
    </nav>
  );
}
