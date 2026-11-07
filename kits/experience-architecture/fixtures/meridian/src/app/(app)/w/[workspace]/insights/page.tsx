import { carriersFor, exceptionsFor, lanesFor, shipmentsFor } from "@/lib/data";
import { Bar, Card, Kpi } from "@/components/ui";

export default async function InsightsSummary({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const ships = shipmentsFor(workspace);
  const late = ships.filter((s) => s.status === "delayed" || s.status === "exception").length;
  const onTime = Math.round(((ships.length - late) / ships.length) * 1000) / 10;
  const lanes = lanesFor(workspace).slice(0, 6);
  const maxLane = Math.max(1, ...lanes.map((l) => l.count));
  const byStatus = new Map<string, number>();
  for (const s of ships) byStatus.set(s.status, (byStatus.get(s.status) ?? 0) + 1);
  return (
    <div className="stack">
      <div className="grid grid-4">
        <Kpi label="On-time %" value={`${onTime}%`} delta="-1.2 pts vs last month" tone="bad" />
        <Kpi label="Shipments" value={ships.length} />
        <Kpi label="Open exceptions" value={exceptionsFor(workspace).filter((e) => e.status !== "resolved").length} />
        <Kpi label="Active carriers" value={carriersFor(workspace).length} />
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
      </div>
    </div>
  );
}
