"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Kits is reached from Skills and the footer, so the header carries four links.
const LINKS = [["/start", "Start"], ["/prompts", "Prompts"], ["/skills", "Skills"], ["/fix", "Fix a problem"]] as const;

// Marks the section you are in, so a deep page still shows where it sits. Kits pages count as Skills, where kits are reached.
const within = (path: string, href: string) => path === href || path.startsWith(href + "/");
export function NavLinks({ className = "links" }: { className?: string }) {
  const path = usePathname() ?? "/";
  return (
    <ul className={className}>
      {LINKS.map(([href, label]) => (
        <li key={href}><Link href={href} aria-current={within(path, href) || (href === "/skills" && within(path, "/kits")) ? "page" : undefined}>{label}</Link></li>
      ))}
    </ul>
  );
}
