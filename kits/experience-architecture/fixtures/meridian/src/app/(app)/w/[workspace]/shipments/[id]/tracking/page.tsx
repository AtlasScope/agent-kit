import { notFound } from "next/navigation";
import { getShipment, trackingEvents } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card } from "@/components/ui";

export default async function ShipmentTracking({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const events = trackingEvents(s);
  return (
    <div className="grid grid-2">
      <Card title="Milestones">
        <ul className="timeline">
          {events.map((e, i) => (
            <li key={i}>
              <span className="muted">{shortDate(e.at)}</span>
              <span>
                <strong>{e.label}</strong>
                <div className="small muted">{e.place}</div>
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Carrier feed">
        <p className="muted small">
          Updates arrive from the carrier&apos;s EDI 214 feed or API every 15 minutes. Carriers also email tracking links in the form{" "}
          <code>/track/{s.proNumber}</code>, which open this tab.
        </p>
        <div className="note" style={{ marginTop: 12 }}>
          Last ping {shortDate(s.etaDate)} · {s.status === "delivered" ? s.destination : "In transit"}
        </div>
      </Card>
    </div>
  );
}
