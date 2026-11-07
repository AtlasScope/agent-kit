"use client";

import { useRouter } from "next/navigation";
import type { ShipmentException } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { StatusBadge, Empty } from "@/components/ui";

type Row = ShipmentException & { customer: string };

export function ExceptionsList({ workspace, rows }: { workspace: string; rows: Row[] }) {
  const router = useRouter();
  if (rows.length === 0) return <Empty>Nothing here. Nice work.</Empty>;
  return (
    <section className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Exception</th>
              <th>Shipment</th>
              <th className="hide-sm">Severity</th>
              <th className="hide-sm">Owner</th>
              <th>Opened</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.id}
                className="clickable"
                onClick={() => router.replace(`/w/${workspace}/exceptions/${e.id}`, { scroll: false })}
              >
                <td>
                  <strong>{e.id}</strong>
                  <div className="small muted">{e.type}</div>
                </td>
                <td>
                  {e.shipmentId}
                  <div className="small muted">{e.customer}</div>
                </td>
                <td className="hide-sm">
                  <StatusBadge status={e.severity} />
                </td>
                <td className="hide-sm">{e.owner}</td>
                <td>{shortDate(e.openedAt)}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
