"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [["/start", "Start"], ["/prompts", "Prompts"], ["/skills", "Skills"], ["/kits", "Kits"], ["/fix", "Fix a problem"]] as const;

// Marks the section you are in, so a deep page still shows where it sits.
export function NavLinks() {
  const path = usePathname() ?? "/";
  return (
    <ul className="links">
      {LINKS.map(([href, label]) => (
        <li key={href}><Link href={href} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>{label}</Link></li>
      ))}
    </ul>
  );
}
