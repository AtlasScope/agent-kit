import Link from "next/link";
import { getCarrier, shipmentsFor } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card, KV, ShipmentStatusBadge } from "@/components/ui";

export default async function CarrierProfile({ params }: { params: Promise<{ workspace: string; carrierId: string }> }) {
  const { workspace, carrierId } = await params;
  const c = getCarrier(carrierId)!;
  const loads = shipmentsFor(workspace).filter((s) => s.carrierId === c.id);
  return (
    <div className="grid grid-2">
      <Card title="Contract">
        <KV
          rows={[
            ["Modes", c.modes.join(", ")],
            ["Claims rate", `${c.claimsRate}%`],
            ["Insurance", "Cargo $250,000 · Auto $1M"],
            ["Payment terms", "Net 30"],
            ["Dispatch", c.contact],
          ]}
        />
      </Card>
      <Card title={`Recent loads (${loads.length})`} pad={false}>
        <table className="table">
          <tbody>
            {loads.slice(0, 10).map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/w/${workspace}/shipments/${s.id}`}>{s.id}</Link>
                </td>
                <td className="hide-sm">
                  {s.origin} → {s.destination}
                </td>
                <td>
                  <ShipmentStatusBadge status={s.status} />
                </td>
                <td>{shortDate(s.pickupDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
