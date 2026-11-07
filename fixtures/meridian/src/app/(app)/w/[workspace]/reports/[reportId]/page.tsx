import { notFound } from "next/navigation";
import { getCarrier, lanesFor, reports, shipmentsFor } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { ExportButton } from "./ExportButton";

export default async function ReportDetail({ params }: { params: Promise<{ workspace: string; reportId: string }> }) {
  const { workspace, reportId } = await params;
  const r = reports.find((x) => x.id === reportId && x.workspace === workspace);
  if (!r) notFound();
  const ships = shipmentsFor(workspace);
  const byCarrier = new Map<string, { total: number; late: number }>();
  for (const s of ships) {
    const cur = byCarrier.get(s.carrierId) ?? { total: 0, late: 0 };
    cur.total += 1;
    if (s.status === "delayed" || s.status === "exception") cur.late += 1;
    byCarrier.set(s.carrierId, cur);
  }
  return (
    <>
      <PageHeader title={r.name} subtitle={`${r.description} Last run ${shortDate(r.lastRun)}.`} actions={<ExportButton name={r.name} />} />
      <div className="grid grid-2">
        <Card title="By carrier" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Shipments</th>
                <th>Late</th>
                <th>On time</th>
              </tr>
            </thead>
            <tbody>
              {[...byCarrier.entries()].map(([id, v]) => (
                <tr key={id}>
                  <td>{getCarrier(id)?.name}</td>
                  <td>{v.total}</td>
                  <td>{v.late}</td>
                  <td>{Math.round(((v.total - v.late) / v.total) * 1000) / 10}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="By lane" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Lane</th>
                <th>Shipments</th>
                <th>On time</th>
              </tr>
            </thead>
            <tbody>
              {lanesFor(workspace).map((l) => (
                <tr key={l.lane}>
                  <td>{l.lane}</td>
                  <td>{l.count}</td>
                  <td>{l.onTime}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
