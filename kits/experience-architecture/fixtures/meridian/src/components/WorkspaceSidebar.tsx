"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SIDEBAR_GROUPS, activeSidebarKey } from "@/lib/nav";
import type { Workspace } from "@/lib/data";
import { LAST_WORKSPACE_COOKIE, writeCookie } from "@/lib/session";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function WorkspaceSidebar({ workspace, openExceptions }: { workspace: Workspace; openExceptions: number }) {
  const pathname = usePathname();
  const active = activeSidebarKey(pathname, workspace.slug);

  useEffect(() => {
    writeCookie(LAST_WORKSPACE_COOKIE, workspace.slug);
  }, [workspace.slug]);

  return (
    <aside className="sidebar" aria-label="Workspace">
      <WorkspaceSwitcher current={workspace} />
      {SIDEBAR_GROUPS.map((group) => (
        <div className="sidebar-group" key={group.label}>
          <div className="sidebar-group-label">{group.label}</div>
          {group.items.map((item) => (
            <Link
              key={item.key}
              href={`/w/${workspace.slug}${item.path}`}
              className={`sidebar-link${active === item.key ? " active" : ""}`}
              aria-current={active === item.key ? "page" : undefined}
            >
              <span>{item.label}</span>
              {item.badge === "exceptions" && openExceptions > 0 ? (
                <span className="sidebar-count">{openExceptions}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
