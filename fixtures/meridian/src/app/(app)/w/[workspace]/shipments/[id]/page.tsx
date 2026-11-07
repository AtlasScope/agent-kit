import Link from "next/link";
import { notFound } from "next/navigation";
import { exceptions, getCarrier, getShipment, invoices } from "@/lib/data";
import { kg, money, shortDate } from "@/lib/format";
import { Card, KV, StatusBadge } from "@/components/ui";

export default async function ShipmentSummary({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const carrier = getCarrier(s.carrierId);
  const related = exceptions.filter((e) => e.shipmentId === s.id);
  const bills = invoices.filter((i) => i.shipmentIds.includes(s.id));
  return (
    <div className="grid grid-2">
      <Card title="Load">
        <KV
          rows={[
            ["Customer PO", s.reference],
            ["PRO number", <span key="pro" className="mono">{s.proNumber}</span>],
            ["Mode", s.mode],
            ["Pickup", shortDate(s.pickupDate)],
            ["ETA", shortDate(s.etaDate)],
            ["Weight", kg(s.weightKg)],
            ["Pieces", s.pieces],
            ["Declared value", money(s.valueUsd)],
          ]}
        />
      </Card>
      <div className="stack">
        <Card title="Carrier" action={carrier ? <Link href={`/w/${workspace}/carriers/${carrier.id}`}>Carrier profile</Link> : null}>
          {carrier ? (
            <KV
              rows={[
                ["Name", carrier.name],
                ["SCAC", carrier.scac],
                ["On time (90d)", `${carrier.onTimePct}%`],
                ["Dispatch", carrier.contact],
              ]}
            />
          ) : (
            <p className="muted">No carrier assigned.</p>
          )}
        </Card>
        <Card title={`Exceptions (${related.length})`} pad={false}>
          {related.length === 0 ? (
            <p className="muted card-pad">No exceptions on this shipment.</p>
          ) : (
            <table className="table">
              <tbody>
                {related.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/w/${workspace}/exceptions/${e.id}`}>{e.id}</Link>
                    </td>
                    <td>{e.type}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Invoices" pad={false}>
          {bills.length === 0 ? (
            <p className="muted card-pad">Not billed yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {bills.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/w/${workspace}/invoices/${i.id}`}>{i.id}</Link>
                    </td>
                    <td>{money(i.amountUsd)}</td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
