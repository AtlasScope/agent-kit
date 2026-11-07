import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", short: "Today" },
  { href: "/schedule", label: "Schedule", short: "Schedule" },
  { href: "/patients", label: "Patients", short: "Patients" },
  { href: "/intake", label: "Intake forms", short: "Intake" },
  { href: "/insurance", label: "Insurance", short: "Insurance" },
  { href: "/notes", label: "Visit notes", short: "Notes", roles: ["clinician"] },
  { href: "/waitlist", label: "Waitlist", short: "Waitlist" },
  { href: "/messages", label: "Messages", short: "Messages" },
];

export const SECONDARY_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", short: "Settings" },
  { href: "/help", label: "Help", short: "Help" },
];

export function visibleFor(role: Role, items: NavItem[]) {
  return items.filter((i) => !i.roles || i.roles.includes(role));
}
