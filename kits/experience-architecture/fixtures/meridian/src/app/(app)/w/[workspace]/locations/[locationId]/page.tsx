import { notFound } from "next/navigation";
import { locations, shipmentsFor } from "@/lib/data";
import { Card, KV, PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function LocationDetail({ params }: { params: Promise<{ workspace: string; locationId: string }> }) {
  const { workspace, locationId } = await params;
  const l = locations.find((x) => x.id === locationId && x.workspace === workspace);
  if (!l) notFound();
  const city = l.city.split(",")[0];
  const touching = shipmentsFor(workspace).filter((s) => s.origin.startsWith(city) || s.destination.startsWith(city));
  return (
    <>
      <PageHeader title={l.name} subtitle={`${l.kind} · ${l.city}`} />
      <div className="grid grid-2">
        <Card title="Site">
          <KV
            rows={[
              ["Dock doors", l.dockDoors],
              ["Receiving hours", l.hours],
              ["Appointment required", l.kind === "Port" ? "Yes, via terminal portal" : "Yes"],
            ]}
          />
        </Card>
        <Card title={`Shipments through this site (${touching.length})`} pad={false}>
          <table className="table">
            <tbody>
              {touching.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/w/${workspace}/shipments/${s.id}`}>{s.id}</Link>
                  </td>
                  <td>{s.origin.startsWith(city) ? "Outbound" : "Inbound"}</td>
                  <td className="muted">{s.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
