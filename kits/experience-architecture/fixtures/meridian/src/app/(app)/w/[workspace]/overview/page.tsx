import Link from "next/link";
import { notFound } from "next/navigation";
import { exceptionsFor, getCarrier, getWorkspace, invoicesFor, lanesFor, shipmentsFor } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { Bar, Card, Kpi, PageHeader, ShipmentStatusBadge } from "@/components/ui";

export default async function Overview({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const ws = getWorkspace(workspace);
  if (!ws) notFound();
  const ships = shipmentsFor(workspace);
  const open = exceptionsFor(workspace).filter((e) => e.status !== "resolved");
  const moving = ships.filter((s) => s.status === "in_transit" || s.status === "at_customs");
  const late = ships.filter((s) => s.status === "delayed" || s.status === "exception");
  const delivered = ships.filter((s) => s.status === "delivered");
  const pendingSpend = invoicesFor(workspace)
    .filter((i) => i.status === "pending" || i.status === "disputed")
    .reduce((a, i) => a + i.amountUsd, 0);
  const lanes = lanesFor(workspace).slice(0, 5);
  const maxLane = Math.max(...lanes.map((l) => l.count), 1);
  const upcoming = [...ships]
    .filter((s) => s.status !== "delivered")
    .sort((a, b) => a.etaDate.localeCompare(b.etaDate))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Today in ${ws.name}`}
        actions={
          <>
            <Link className="btn" href={`/w/${workspace}/shipments`}>
              View shipments
            </Link>
            <Link className="btn btn-primary" href={`/w/${workspace}/shipments/new`}>
              New shipment
            </Link>
          </>
        }
      />
      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <Kpi label="Moving now" value={moving.length} delta={`${delivered.length} delivered this month`} />
        <Kpi label="Running late" value={late.length} delta={`${Math.round((late.length / ships.length) * 100)}% of active`} tone="bad" />
        <Kpi label="Open exceptions" value={open.length} />
        <Kpi label="Invoices awaiting action" value={money(pendingSpend)} />
      </div>
      <div className="grid grid-2">
        <Card title="Arriving next" pad={false}>
          <table className="table">
            <tbody>
              {upcoming.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/w/${workspace}/shipments/${s.id}`}>{s.id}</Link>
                    <div className="small muted">{s.customer}</div>
                  </td>
                  <td className="hide-sm">{getCarrier(s.carrierId)?.name}</td>
                  <td>
                    <ShipmentStatusBadge status={s.status} />
                  </td>
                  <td>{shortDate(s.etaDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Busiest lanes" action={<Link href={`/w/${workspace}/insights/lanes`}>Lane insights</Link>}>
          {lanes.map((l) => (
            <Bar key={l.lane} label={l.lane} value={l.count} max={maxLane} />
          ))}
        </Card>
      </div>
    </>
  );
}
