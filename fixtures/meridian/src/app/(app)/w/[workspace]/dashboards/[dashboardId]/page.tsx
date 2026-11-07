import { notFound } from "next/navigation";
import { carriersFor, dashboards, exceptionsFor, invoicesFor, lanesFor, shipmentsFor } from "@/lib/data";
import { money } from "@/lib/format";
import { Bar, Card, Kpi, PageHeader } from "@/components/ui";

export default async function DashboardDetail({ params }: { params: Promise<{ workspace: string; dashboardId: string }> }) {
  const { workspace, dashboardId } = await params;
  const d = dashboards.find((x) => x.id === dashboardId && x.workspace === workspace);
  if (!d) notFound();
  const ships = shipmentsFor(workspace);
  const late = ships.filter((s) => s.status === "delayed" || s.status === "exception").length;
  const lanes = lanesFor(workspace).slice(0, 6);
  const maxLane = Math.max(1, ...lanes.map((l) => l.count));
  const spend = invoicesFor(workspace).reduce((a, i) => a + i.amountUsd, 0);
  const byStatus = new Map<string, number>();
  for (const s of ships) byStatus.set(s.status, (byStatus.get(s.status) ?? 0) + 1);
  return (
    <>
      <PageHeader title={d.name} subtitle={`Owned by ${d.owner}`} />
      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <Kpi label="On-time %" value={`${Math.round(((ships.length - late) / ships.length) * 1000) / 10}%`} />
        <Kpi label="Shipments" value={ships.length} />
        <Kpi label="Open exceptions" value={exceptionsFor(workspace).filter((e) => e.status !== "resolved").length} />
        <Kpi label="Billed spend" value={money(spend)} />
      </div>
      <div className="grid grid-2">
        <Card title="Shipments by status">
          {[...byStatus.entries()].map(([k, v]) => (
            <Bar key={k} label={k.replace("_", " ")} value={v} max={ships.length} />
          ))}
        </Card>
        <Card title="Lane volume">
          {lanes.map((l) => (
            <Bar key={l.lane} label={l.lane} value={l.count} max={maxLane} />
          ))}
        </Card>
        <Card title="On-time % by carrier">
          {carriersFor(workspace).map((c) => (
            <Bar key={c.id} label={c.name} value={c.onTimePct} max={100} suffix="%" />
          ))}
        </Card>
      </div>
    </>
  );
}
