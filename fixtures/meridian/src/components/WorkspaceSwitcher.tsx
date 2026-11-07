"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { workspaces, type Workspace } from "@/lib/data";

export function WorkspaceSwitcher({ current }: { current: Workspace }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const choose = (slug: string) => {
    setOpen(false);
    if (slug === current.slug) return;
    router.push(pathname.replace(`/w/${current.slug}`, `/w/${slug}`));
  };

  return (
    <div className="switcher">
      <button className="switcher-button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="switcher-dot" style={{ background: current.color }} />
        <span>
          <div className="switcher-name">{current.name}</div>
          <div className="switcher-sub">
            {current.region} · {current.plan}
          </div>
        </span>
      </button>
      {open ? (
        <div className="switcher-menu" role="menu">
          {workspaces.map((w) => (
            <button key={w.slug} className="switcher-option" role="menuitem" onClick={() => choose(w.slug)}>
              <span className="switcher-dot" style={{ background: w.color, width: 14, height: 14 }} />
              {w.name}
              {w.slug === current.slug ? <span className="muted small">current</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
