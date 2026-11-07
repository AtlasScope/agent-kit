import { lanesFor } from "@/lib/data";
import { kg } from "@/lib/format";
import { Card } from "@/components/ui";

export default async function LaneInsights({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const lanes = lanesFor(workspace);
  return (
    <Card title="Lanes" pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Lane</th>
            <th>Shipments</th>
            <th className="hide-sm">Weight</th>
            <th>On time</th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((l) => (
            <tr key={l.lane}>
              <td>{l.lane}</td>
              <td>{l.count}</td>
              <td className="hide-sm">{kg(l.weight)}</td>
              <td>{l.onTime}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
