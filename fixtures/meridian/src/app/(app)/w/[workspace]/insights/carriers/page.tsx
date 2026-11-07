import Link from "next/link";
import { carriersFor, shipmentsFor } from "@/lib/data";
import { Card } from "@/components/ui";

export default async function CarrierInsights({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const ships = shipmentsFor(workspace);
  const rows = carriersFor(workspace)
    .map((c) => ({ c, loads: ships.filter((s) => s.carrierId === c.id).length }))
    .sort((a, b) => b.loads - a.loads);
  return (
    <Card title="Carrier performance" pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Carrier</th>
            <th>Loads</th>
            <th>On time</th>
            <th>Claims</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, loads }) => (
            <tr key={c.id}>
              <td>
                <Link href={`/w/${workspace}/carriers/${c.id}/performance`}>{c.name}</Link>
              </td>
              <td>{loads}</td>
              <td>{c.onTimePct}%</td>
              <td>{c.claimsRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
