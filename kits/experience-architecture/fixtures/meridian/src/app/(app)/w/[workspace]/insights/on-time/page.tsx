import { carriersFor, lanesFor } from "@/lib/data";
import { Bar, Card } from "@/components/ui";

export default async function OnTimeInsights({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const lanes = lanesFor(workspace);
  const cs = carriersFor(workspace);
  return (
    <div className="grid grid-2">
      <Card title="On-time % by lane">
        {lanes.map((l) => (
          <Bar key={l.lane} label={l.lane} value={l.onTime} max={100} suffix="%" />
        ))}
      </Card>
      <Card title="On-time % by carrier">
        {cs.map((c) => (
          <Bar key={c.id} label={c.name} value={c.onTimePct} max={100} suffix="%" />
        ))}
      </Card>
    </div>
  );
}
