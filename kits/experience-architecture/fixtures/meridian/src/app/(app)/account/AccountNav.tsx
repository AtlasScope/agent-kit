"use client";

import { usePathname } from "next/navigation";
import { SubNav } from "@/components/ui";

const items = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/preferences", label: "Preferences" },
  { href: "/account/security", label: "Security" },
  { href: "/account/api-tokens", label: "API tokens" },
];

export function AccountNav() {
  const pathname = usePathname();
  return <SubNav items={items} current={pathname} />;
}
