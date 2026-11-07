import { getCarrier, shipmentsFor } from "@/lib/data";
import { Card, Kpi } from "@/components/ui";

export default async function CarrierPerformance({ params }: { params: Promise<{ workspace: string; carrierId: string }> }) {
  const { workspace, carrierId } = await params;
  const c = getCarrier(carrierId)!;
  const loads = shipmentsFor(workspace).filter((s) => s.carrierId === carrierId);
  const late = loads.filter((s) => s.status === "delayed" || s.status === "exception").length;
  return (
    <div className="stack">
      <div className="grid grid-3">
        <Kpi label="On time (90d)" value={`${c.onTimePct}%`} />
        <Kpi label="Late loads this month" value={late} tone={late > 2 ? "bad" : undefined} />
        <Kpi label="Claims rate" value={`${c.claimsRate}%`} />
      </div>
      <Card title="Scorecard notes">
        <p className="muted">Scorecards are reviewed with the carrier each quarter. Tender acceptance is reported by the carrier and not yet verified.</p>
      </Card>
    </div>
  );
}
