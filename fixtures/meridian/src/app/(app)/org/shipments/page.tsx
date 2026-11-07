import Link from "next/link";
import type { Metadata } from "next";
import { getCarrier, getWorkspace, shipments, workspaces, type ShipmentStatus } from "@/lib/data";
import { shortDate, STATUS_LABEL } from "@/lib/format";
import { Badge, ShipmentStatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "All shipments" };

const statusKeys = Object.keys(STATUS_LABEL) as ShipmentStatus[];

export default async function OrgShipments({ searchParams }: { searchParams: Promise<{ ws?: string; status?: string }> }) {
  const { ws, status } = await searchParams;
  const rows = shipments.filter((s) => (!ws || s.workspace === ws) && (!status || s.status === status));
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { ws, status, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/org/shipments?${qs}` : "/org/shipments";
  };
  return (
    <section className="card">
      <div className="card-head">
        <h2>All shipments across workspaces</h2>
        <span className="muted small">{rows.length} shipments</span>
      </div>
      <div className="filters">
        <Link className={`btn${!ws ? " btn-primary" : ""}`} href={link({ ws: undefined })}>
          All workspaces
        </Link>
        {workspaces.map((w) => (
          <Link key={w.slug} className={`btn${ws === w.slug ? " btn-primary" : ""}`} href={link({ ws: w.slug })}>
            {w.name}
          </Link>
        ))}
      </div>
      <div className="filters">
        <Link className={`btn${!status ? " btn-primary" : ""}`} href={link({ status: undefined })}>
          Any status
        </Link>
        {statusKeys.map((k) => (
          <Link key={k} className={`btn${status === k ? " btn-primary" : ""}`} href={link({ status: k })}>
            {STATUS_LABEL[k]}
          </Link>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Workspace</th>
              <th className="hide-sm">Lane</th>
              <th className="hide-sm">Carrier</th>
              <th>Status</th>
              <th className="hide-sm">ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/w/${s.workspace}/shipments/${s.id}`}>{s.id}</Link>
                  <div className="small muted">{s.customer}</div>
                </td>
                <td>
                  <Badge>{getWorkspace(s.workspace)?.name}</Badge>
                </td>
                <td className="hide-sm">
                  {s.origin} → {s.destination}
                </td>
                <td className="hide-sm">{getCarrier(s.carrierId)?.name}</td>
                <td>
                  <ShipmentStatusBadge status={s.status} />
                </td>
                <td className="hide-sm">{shortDate(s.etaDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
