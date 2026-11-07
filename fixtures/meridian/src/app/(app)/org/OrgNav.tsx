"use client";

import { usePathname } from "next/navigation";
import { SubNav } from "@/components/ui";

const items = [
  { href: "/org", label: "Overview" },
  { href: "/org/shipments", label: "All shipments" },
  { href: "/org/workspaces", label: "Workspaces" },
  { href: "/org/members", label: "Members" },
  { href: "/org/billing", label: "Billing" },
  { href: "/org/settings/general", label: "Settings" },
  { href: "/org/audit-log", label: "Audit log" },
];

export function OrgNav() {
  const pathname = usePathname();
  const current =
    items
      .filter((i) => pathname === i.href || (i.href !== "/org" && pathname.startsWith(i.href.split("/").slice(0, 3).join("/"))))
      .pop()?.href ?? pathname;
  return <SubNav items={items} current={current} />;
}
