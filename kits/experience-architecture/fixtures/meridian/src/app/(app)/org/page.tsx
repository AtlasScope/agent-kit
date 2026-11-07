import Link from "next/link";
import { exceptions, invoices, members, shipments, workspaces } from "@/lib/data";
import { money } from "@/lib/format";
import { Card, Kpi, Bar } from "@/components/ui";

export default function OrgOverview() {
  const openEx = exceptions.filter((e) => e.status !== "resolved").length;
  const spend = invoices.filter((i) => i.status === "paid" || i.status === "approved").reduce((a, i) => a + i.amountUsd, 0);
  const maxShips = Math.max(...workspaces.map((w) => shipments.filter((s) => s.workspace === w.slug).length));
  return (
    <div className="stack">
      <div className="grid grid-4">
        <Kpi label="Shipments this month" value={shipments.length} delta="+8% vs October" />
        <Kpi label="Open exceptions" value={openEx} delta="+3 since yesterday" tone="bad" />
        <Kpi label="Approved spend" value={money(spend)} />
        <Kpi label="Members" value={members.length} />
      </div>
      <Card title="Volume by workspace" action={<Link href="/org/shipments">See all shipments</Link>}>
        {workspaces.map((w) => (
          <Bar key={w.slug} label={w.name} value={shipments.filter((s) => s.workspace === w.slug).length} max={maxShips} />
        ))}
      </Card>
    </div>
  );
}
