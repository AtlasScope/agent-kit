import { lanesFor } from "@/lib/data";
import { Card } from "@/components/ui";
import { LaneTargets } from "./LaneTargets";

export default async function LaneSettings({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const lanes = lanesFor(workspace).map((l) => l.lane);
  return (
    <Card title="Lane targets">
      <p className="muted small" style={{ marginBottom: 12 }}>
        Transit-time targets used to decide when a shipment counts as late.
      </p>
      <LaneTargets lanes={lanes} />
    </Card>
  );
}
