import { reports } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui";
import { ScheduleToggles } from "./ScheduleToggles";

export default async function ScheduledReports({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = reports.filter((r) => r.workspace === workspace && r.cadence !== "ad hoc");
  return (
    <>
      <PageHeader title="Scheduled deliveries" subtitle="Reports emailed to people inside and outside your company." />
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Cadence</th>
              <th>Recipients</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <Badge>{r.cadence}</Badge>
                </td>
                <td>{r.recipients}</td>
                <td>
                  <ScheduleToggles id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
