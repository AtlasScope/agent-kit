"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/org/settings/general", label: "General" },
  { href: "/org/settings/notifications", label: "Notification channels" },
  { href: "/org/settings/sso", label: "Single sign-on" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <div className="row" style={{ marginBottom: 14 }}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`btn${pathname === i.href ? " btn-primary" : ""}`}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}
