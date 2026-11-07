import Link from "next/link";
import type { Metadata } from "next";
import { reports } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = reports.filter((r) => r.workspace === workspace);
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Tables you can export or send on a schedule."
        actions={
          <Link className="btn" href={`/w/${workspace}/reports/scheduled`}>
            Scheduled deliveries
          </Link>
        }
      />
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Report</th>
              <th className="hide-sm">Description</th>
              <th>Cadence</th>
              <th>Last run</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/w/${workspace}/reports/${r.id}`}>{r.name}</Link>
                </td>
                <td className="hide-sm muted">{r.description}</td>
                <td>
                  <Badge>{r.cadence}</Badge>
                </td>
                <td>{shortDate(r.lastRun)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
