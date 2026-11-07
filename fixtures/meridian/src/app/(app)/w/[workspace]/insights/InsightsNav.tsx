"use client";

import { useParams, usePathname } from "next/navigation";
import { SubNav } from "@/components/ui";

export function InsightsNav() {
  const { workspace } = useParams<{ workspace: string }>();
  const pathname = usePathname();
  const base = `/w/${workspace}/insights`;
  return (
    <SubNav
      current={pathname}
      items={[
        { href: base, label: "Summary" },
        { href: `${base}/on-time`, label: "On-time" },
        { href: `${base}/lanes`, label: "Lanes" },
        { href: `${base}/carriers`, label: "Carriers" },
      ]}
    />
  );
}
