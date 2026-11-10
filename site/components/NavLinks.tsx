"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Kits is reached from Skills and the footer, so the header carries four links.
const LINKS = [["/start", "Start"], ["/prompts", "Prompts"], ["/skills", "Skills"], ["/fix", "Fix a problem"]] as const;

// Marks the section you are in, so a deep page still shows where it sits.
export function NavLinks({ className = "links" }: { className?: string }) {
  const path = usePathname() ?? "/";
  return (
    <ul className={className}>
      {LINKS.map(([href, label]) => (
        <li key={href}><Link href={href} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>{label}</Link></li>
      ))}
    </ul>
  );
}
