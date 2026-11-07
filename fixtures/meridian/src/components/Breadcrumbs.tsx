"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { crumbsFor } from "@/lib/nav";
import { workspaces } from "@/lib/data";

const names: Record<string, string> = Object.fromEntries(workspaces.map((w) => [w.slug, w.name]));

export function Breadcrumbs({ extra = {} }: { extra?: Record<string, string> }) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname, { ...names, ...extra });
  if (crumbs.length < 2) return null;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <Fragment key={c.href}>
          {i > 0 ? <span className="sep">/</span> : null}
          {i === crumbs.length - 1 ? <span aria-current="page">{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
        </Fragment>
      ))}
    </nav>
  );
}
