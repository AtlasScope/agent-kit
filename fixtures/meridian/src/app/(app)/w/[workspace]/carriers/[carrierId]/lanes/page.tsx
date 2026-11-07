import { shipmentsFor } from "@/lib/data";
import { Card, Bar } from "@/components/ui";

export default async function CarrierLanes({ params }: { params: Promise<{ workspace: string; carrierId: string }> }) {
  const { workspace, carrierId } = await params;
  const loads = shipmentsFor(workspace).filter((s) => s.carrierId === carrierId);
  const lanes = new Map<string, number>();
  for (const s of loads) lanes.set(`${s.origin} → ${s.destination}`, (lanes.get(`${s.origin} → ${s.destination}`) ?? 0) + 1);
  const rows = [...lanes.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Card title="Lanes served">
      {rows.length === 0 ? <p className="muted">No loads on record.</p> : rows.map(([lane, n]) => <Bar key={lane} label={lane} value={n} max={max} />)}
    </Card>
  );
}
