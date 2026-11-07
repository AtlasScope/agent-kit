import { notFound } from "next/navigation";
import { chargesFor, getShipment } from "@/lib/data";
import { money } from "@/lib/format";
import { Card } from "@/components/ui";

export default async function ShipmentCharges({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const rows = chargesFor(s);
  const total = rows.reduce((a, r) => a + r.amount, 0);
  return (
    <Card title="Charges" pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Charge</th>
            <th style={{ textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td style={{ textAlign: "right" }}>{money(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "right" }}>
              <strong>{money(total)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
